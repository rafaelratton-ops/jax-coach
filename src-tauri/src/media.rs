use crate::AppState;
use serde::Serialize;
#[cfg(windows)]
use std::os::windows::process::CommandExt;
use std::{
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::Ordering,
    time::{Duration, SystemTime},
};
use tauri::State;

fn tool(name: &str) -> Command {
    let mut command = Command::new(name);
    #[cfg(windows)]
    command.creation_flags(0x08000000);
    command
}
fn bounded_output(command: &mut Command) -> std::io::Result<std::process::Output> {
    let mut child = command
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()?;
    let start = std::time::Instant::now();
    loop {
        if child.try_wait()?.is_some() {
            return child.wait_with_output();
        }
        if start.elapsed() > Duration::from_secs(10) {
            let _ = child.kill();
            let _ = child.wait();
            return Err(std::io::Error::new(
                std::io::ErrorKind::TimedOut,
                "Media probe timeout",
            ));
        }
        std::thread::sleep(Duration::from_millis(50));
    }
}
fn available(name: &str) -> bool {
    bounded_output(tool(name).arg("-version"))
        .map(|o| o.status.success())
        .unwrap_or(false)
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Recording {
    path: String,
    started_at: String,
    duration_seconds: f64,
    size_bytes: u64,
    confidence: f64,
    reason: String,
    time_source: String,
}
fn video(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase()
            .as_str(),
        "mp4" | "mkv" | "webm" | "mov"
    )
}
fn candidates(root: &Path, depth: u8, files: &mut Vec<PathBuf>) {
    if depth > 5 || files.len() >= 300 {
        return;
    }
    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten() {
            if files.len() >= 300 {
                break;
            }
            let path = entry.path();
            if let Ok(meta) = entry.metadata() {
                if entry.file_type().map(|t| t.is_symlink()).unwrap_or(true) {
                    continue;
                }
                if meta.is_dir() {
                    candidates(&path, depth + 1, files);
                } else if video(&path)
                    && meta
                        .modified()
                        .ok()
                        .and_then(|t| t.elapsed().ok())
                        .map(|age| age > Duration::from_secs(90))
                        .unwrap_or(false)
                {
                    files.push(path);
                }
            }
        }
    }
}
#[tauri::command]
pub async fn scan_outplayed_directory(
    state: State<'_, AppState>,
    directory: String,
) -> Result<Vec<Recording>, String> {
    if state.focus_active.load(Ordering::SeqCst) {
        return Err("Feche o painel de foco antes de buscar vídeos.".into());
    }
    tauri::async_runtime::spawn_blocking(move || {
        let root = PathBuf::from(directory.trim());
        if !root.is_dir() { return Err("Essa pasta não foi encontrada. Confira o caminho no Outplayed.".into()); }
        let probe = available("ffprobe");
        let mut paths = Vec::new();
        candidates(&root, 0, &mut paths);
        let mut results = Vec::new();
        for path in paths {
            let metadata = path.metadata().map_err(|_| "Não foi possível ler um vídeo.")?;
            let mut duration = 0.;
            if probe {
                if let Ok(output) = bounded_output(tool("ffprobe").args(["-v", "error", "-show_entries", "format=duration", "-of", "json"]).arg(&path)) {
                    if let Ok(value) = serde_json::from_slice::<serde_json::Value>(&output.stdout) {
                        duration = value["format"]["duration"].as_str().and_then(|s| s.parse::<f64>().ok()).filter(|n| n.is_finite() && *n > 0. && *n < 604800.).unwrap_or(0.);
                    }
                }
            }
            // mtime is only an estimate of recording end; never silently call it capture start.
            let end: chrono::DateTime<chrono::Utc> = metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH).into();
            let start = end - chrono::Duration::milliseconds((duration * 1000.) as i64);
            results.push(Recording { path: path.to_string_lossy().into(), started_at: start.to_rfc3339(), duration_seconds: duration, size_bytes: metadata.len(),
                confidence: 0., reason: if probe { "Início estimado pela última modificação menos duração. Confirme o horário antes de recortar." } else { "FFprobe não encontrado. Duração indisponível." }.into(), time_source: "estimated".into() });
        }
        results.sort_by(|a, b| b.started_at.cmp(&a.started_at));
        Ok(results)
    }).await.map_err(|_| "Busca interrompida.")?
}
#[tauri::command]
pub async fn detect_environment(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let sqlite = crate::persistence::connection(&state).is_ok();
    let session = state
        .riot_key
        .lock()
        .map_err(|_| "Conexão ocupada")?
        .is_some();
    tauri::async_runtime::spawn_blocking(move || {
        let mut folders = Vec::new();
        if let Ok(user) = std::env::var("USERPROFILE") {
            for suffix in ["Videos/Outplayed", "Videos/Overwolf/Outplayed", "Videos/Overwolf"] {
                let path = PathBuf::from(&user).join(suffix);
                if path.is_dir() { folders.push(path.to_string_lossy().to_string()); }
            }
        }
        serde_json::json!({ "sqlite": sqlite, "riotSession": session, "ffmpeg": available("ffmpeg"), "ffprobe": available("ffprobe"), "folders": folders })
    }).await.map_err(|_| "Não foi possível verificar este computador.".into())
}
#[tauri::command]
pub async fn create_clip(
    state: State<'_, AppState>,
    source_path: String,
    start_seconds: f64,
    duration_seconds: f64,
) -> Result<String, String> {
    if state.focus_active.load(Ordering::SeqCst) {
        return Err("Feche o painel de foco antes de recortar.".into());
    }
    if !start_seconds.is_finite()
        || start_seconds < 0.
        || !duration_seconds.is_finite()
        || !(1.0..=90.0).contains(&duration_seconds)
    {
        return Err("Intervalo de recorte inválido.".into());
    }
    let output_dir = state.data_dir.join("clips");
    tauri::async_runtime::spawn_blocking(move || {
        let source = PathBuf::from(source_path).canonicalize().map_err(|_| "Vídeo original não encontrado.")?;
        if !video(&source) || !source.is_file() { return Err("Escolha um arquivo de vídeo.".into()); }
        if !available("ffmpeg") { return Err("FFmpeg não encontrado neste computador. Os originais continuam intactos.".into()); }
        std::fs::create_dir_all(&output_dir).map_err(|_| "Não foi possível criar a pasta de recortes.")?;
        let output = output_dir.join(format!("review-{}.mp4", chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        // Individual args; no shell interpolation. -n refuses overwrite. Re-encode for event alignment.
        let mut child = tool("ffmpeg").args(["-nostdin", "-n", "-hide_banner", "-loglevel", "error", "-ss", &start_seconds.to_string(), "-i"]).arg(&source)
            .args(["-t", &duration_seconds.to_string(), "-map", "0:v:0", "-map", "0:a?", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac"])
            .arg(&output).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|_| "Não foi possível iniciar o FFmpeg.")?;
        let start = std::time::Instant::now();
        loop {
            match child.try_wait().map_err(|_| "Falha ao acompanhar o recorte.")? {
                Some(status) if status.success() => return Ok(output.to_string_lossy().into()),
                Some(_) => return Err("FFmpeg não conseguiu recortar este vídeo. Verifique se o arquivo está finalizado.".into()),
                None if start.elapsed() > Duration::from_secs(120) => { let _ = child.kill(); let _ = child.wait(); return Err("Recorte demorou demais e foi interrompido.".into()); },
                _ => std::thread::sleep(Duration::from_millis(200)),
            }
        }
    }).await.map_err(|_| "Recorte interrompido.")?
}
#[tauri::command]
pub fn show_clips(state: State<'_, AppState>) -> Result<(), String> {
    let path = state.data_dir.join("clips");
    std::fs::create_dir_all(&path).map_err(|_| "Pasta indisponível.")?;
    tool("explorer.exe")
        .arg(path)
        .spawn()
        .map_err(|_| "Não foi possível abrir a pasta.")?;
    Ok(())
}

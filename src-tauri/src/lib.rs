use std::{
    path::PathBuf,
    sync::{atomic::AtomicBool, Mutex},
};
use tauri::Manager;
mod live;
mod media;
mod persistence;
mod riot;

pub struct AppState {
    db_path: PathBuf,
    data_dir: PathBuf,
    riot_key: Mutex<Option<String>>,
    focus_active: AtomicBool,
    focus_snapshot: Mutex<serde_json::Value>,
}

#[tauri::command]
fn open_focus(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    snapshot: serde_json::Value,
) -> Result<(), String> {
    use std::sync::atomic::Ordering;
    if let Some(window) = app.get_webview_window("focus") {
        return window
            .set_focus()
            .map_err(|_| "Não foi possível abrir o painel.".into());
    }
    *state.focus_snapshot.lock().map_err(|_| "Painel ocupado")? = snapshot;
    state.focus_active.store(true, Ordering::SeqCst);
    let result = tauri::WebviewWindowBuilder::new(
        &app,
        "focus",
        tauri::WebviewUrl::App("index.html?focus=1".into()),
    )
    .title("Jax Coach · foco")
    .inner_size(440., 560.)
    .min_inner_size(360., 400.)
    .always_on_top(true)
    .build();
    match result {
        Ok(window) => {
            let app_clone = app.clone();
            window.on_window_event(move |event| {
                if matches!(event, tauri::WindowEvent::Destroyed) {
                    app_clone
                        .state::<AppState>()
                        .focus_active
                        .store(false, Ordering::SeqCst);
                }
            });
            Ok(())
        }
        Err(_) => {
            state.focus_active.store(false, Ordering::SeqCst);
            Err("Não foi possível abrir o painel.".into())
        }
    }
}
#[tauri::command]
fn focus_snapshot(state: tauri::State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(state
        .focus_snapshot
        .lock()
        .map_err(|_| "Painel ocupado")?
        .clone())
}
#[tauri::command]
fn close_focus(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("focus") {
        window
            .close()
            .map_err(|_| "Não foi possível fechar o painel.")?;
    }
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            let state = AppState {
                db_path: data_dir.join("jax-coach.sqlite3"),
                data_dir,
                riot_key: Mutex::new(None),
                focus_active: AtomicBool::new(false),
                focus_snapshot: Mutex::new(serde_json::json!({})),
            };
            persistence::connection(&state)?;
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            persistence::load_library,
            persistence::save_library,
            riot::riot_sync_matches,
            riot::riot_test_connection,
            riot::riot_timeline,
            live::live_match_context,
            live::live_diagnostics,
            media::scan_outplayed_directory,
            media::detect_environment,
            media::create_clip,
            media::show_clips,
            open_focus,
            focus_snapshot,
            close_focus
        ])
        .run(tauri::generate_context!())
        .expect("error while running Jax Coach");
}

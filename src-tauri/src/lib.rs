#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tauri::{Manager, State};
use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};

struct AppState { db_path: PathBuf }

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RecordingCandidate { path: String, started_at: String, duration_seconds: u64, size_bytes: u64, confidence: f32, reason: String, extension: String }

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct RiotAccount { puuid: String, game_name: String, tag_line: String }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RiotMatchResponse { info: RiotMatchInfo }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RiotMatchInfo { game_start_timestamp: i64, game_duration: u64, queue_id: u64, participants: Vec<RiotParticipant> }

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RiotParticipant { puuid: String, champion_name: String, team_position: String, team_id: u64, win: bool, kills: u64, deaths: u64, assists: u64, total_minions_killed: u64, neutral_minions_killed: u64 }

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RiotMatchSummary { id: String, started_at: String, duration_seconds: u64, queue: String, champion: String, role: String, opponent: String, result: String, kda: String, cs: u64, source: String, analyzed: bool }

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct RiotSyncResult { account: RiotAccount, matches: Vec<RiotMatchSummary>, synced_at: String }

fn connection(state: &AppState) -> SqlResult<Connection> {
    let conn = Connection::open(&state.db_path)?;
    conn.execute_batch(include_str!("../../migrations/001_initial.sql"))?;
    Ok(conn)
}

#[tauri::command]
fn health_check(state: State<'_, AppState>) -> Result<String, String> {
    connection(&state).map(|_| "sqlite-ready".to_string()).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_matches(state: State<'_, AppState>) -> Result<String, String> {
    let conn = connection(&state).map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, champion, opponent, result, started_at, duration_seconds FROM matches ORDER BY started_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok(serde_json::json!({
        "id": row.get::<_, String>(0)?, "champion": row.get::<_, String>(1)?, "opponent": row.get::<_, String>(2)?,
        "result": row.get::<_, String>(3)?, "startedAt": row.get::<_, String>(4)?, "durationSeconds": row.get::<_, i64>(5)?
    }))).map_err(|e| e.to_string())?;
    let mut values = Vec::new();
    for row in rows { values.push(row.map_err(|e| e.to_string())?); }
    serde_json::to_string(&values).map_err(|e| e.to_string())
}

#[tauri::command]
fn scan_outplayed_directory(directory: String) -> Result<Vec<RecordingCandidate>, String> {
    let root = PathBuf::from(directory);
    if !root.exists() { return Err("Pasta de gravações não encontrada".to_string()); }
    let mut found = Vec::new();
    let entries = std::fs::read_dir(root).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        let extension = path.extension().and_then(|value| value.to_str()).unwrap_or("").to_ascii_lowercase();
        if !matches!(extension.as_str(), "mp4" | "mkv" | "webm" | "mov") { continue; }
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let modified = metadata.modified().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|value| value.as_secs()).unwrap_or(0);
        found.push(RecordingCandidate { path: path.to_string_lossy().to_string(), started_at: modified.to_string(), duration_seconds: 0, size_bytes: metadata.len(), confidence: 0.0, reason: "aguardando score por horário/duração".to_string(), extension });
    }
    Ok(found)
}

#[tauri::command]
async fn riot_sync_matches(game_name: String, tag_line: String, api_key: String, count: u8) -> Result<RiotSyncResult, String> {
    if api_key.trim().is_empty() { return Err("Chave Riot vazia".to_string()); }
    let client = reqwest::Client::new();
    let account_url = format!("https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{}/{}", urlencoding::encode(&game_name), urlencoding::encode(&tag_line));
    let account: RiotAccount = client.get(account_url).header("X-Riot-Token", &api_key).send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
    let safe_count = count.clamp(1, 10);
    let ids_url = format!("https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/{}/ids?start=0&count={}", account.puuid, safe_count);
    let ids: Vec<String> = client.get(ids_url).header("X-Riot-Token", &api_key).send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
    let mut matches = Vec::new();
    for id in ids {
        let match_url = format!("https://americas.api.riotgames.com/lol/match/v5/matches/{}", id);
        let payload: RiotMatchResponse = client.get(match_url).header("X-Riot-Token", &api_key).send().await.map_err(|e| e.to_string())?.error_for_status().map_err(|e| e.to_string())?.json().await.map_err(|e| e.to_string())?;
        if let Some(player) = payload.info.participants.iter().find(|participant| participant.puuid == account.puuid) {
            let opponent = payload.info.participants.iter().find(|participant| participant.team_id != player.team_id).map(|participant| participant.champion_name.clone()).unwrap_or_else(|| "Desconhecido".to_string());
            let started_at = chrono::DateTime::from_timestamp_millis(payload.info.game_start_timestamp).map(|value| value.to_rfc3339()).unwrap_or_else(|| payload.info.game_start_timestamp.to_string());
            matches.push(RiotMatchSummary { id, started_at, duration_seconds: payload.info.game_duration, queue: payload.info.queue_id.to_string(), champion: player.champion_name.clone(), role: if player.team_position.is_empty() { "UNKNOWN".to_string() } else { player.team_position.clone() }, opponent, result: if player.win { "win".to_string() } else { "loss".to_string() }, kda: format!("{} / {} / {}", player.kills, player.deaths, player.assists), cs: player.total_minions_killed + player.neutral_minions_killed, source: "riot-api".to_string(), analyzed: false });
        }
    }
    Ok(RiotSyncResult { account, matches, synced_at: chrono::Utc::now().to_rfc3339() })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            app.manage(AppState { db_path: data_dir.join("jax-coach.sqlite3") });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![health_check, list_matches, scan_outplayed_directory, riot_sync_matches])
        .run(tauri::generate_context!())
        .expect("error while running Jax Coach");
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tauri::{Manager, State};
use rusqlite::{Connection, Result};

struct AppState { db_path: PathBuf }

fn connection(state: &AppState) -> Result<Connection> {
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
        .invoke_handler(tauri::generate_handler![health_check, list_matches])
        .run(tauri::generate_context!())
        .expect("error while running Jax Coach");
}

fn main() { run(); }

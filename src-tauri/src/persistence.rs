use crate::AppState;
use rusqlite::{Connection, OptionalExtension};
use tauri::State;

pub fn connection(state: &AppState) -> rusqlite::Result<Connection> {
    let conn = Connection::open(&state.db_path)?;
    conn.busy_timeout(std::time::Duration::from_secs(5))?;
    conn.execute_batch(include_str!("../../migrations/001_initial.sql"))?;
    conn.execute_batch(include_str!("../../migrations/002_library.sql"))?;
    Ok(conn)
}

#[tauri::command]
pub fn load_library(state: State<'_, AppState>) -> Result<Option<String>, String> {
    connection(&state)
        .map_err(|_| "Não foi possível abrir o banco local.")?
        .query_row("SELECT payload FROM library WHERE id = 1", [], |row| {
            row.get(0)
        })
        .optional()
        .map_err(|_| "Não foi possível ler seu histórico. Nenhum dado foi alterado.".into())
}

#[tauri::command]
pub fn save_library(state: State<'_, AppState>, payload: String) -> Result<(), String> {
    validate(&payload)?;
    let conn = connection(&state).map_err(|_| "Não foi possível abrir o banco local.")?;
    store(&conn, &payload)
}
fn validate(payload: &str) -> Result<(), String> {
    if payload.len() > 30_000_000 {
        return Err("Biblioteca muito grande para salvar.".into());
    }
    let parsed: serde_json::Value =
        serde_json::from_str(&payload).map_err(|_| "Dados inválidos.")?;
    if parsed["version"] != 2
        || !parsed["matches"].is_array()
        || !parsed["facts"].is_array()
        || !parsed["analyses"].is_object()
        || !parsed["notes"].is_object()
    {
        return Err("Formato da biblioteca inválido.".into());
    }
    if payload.contains("RGAPI-") {
        return Err("Remova a chave das anotações antes de salvar.".into());
    }
    Ok(())
}
fn store(conn: &Connection, payload: &str) -> Result<(), String> {
    conn.execute("INSERT INTO library (id, payload) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=CURRENT_TIMESTAMP", [&payload])
        .map_err(|_| "Não foi possível salvar seu histórico. Confira o espaço no disco.")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn migrations_are_repeatable_and_library_survives_updates() {
        let conn = Connection::open_in_memory().unwrap();
        for _ in 0..2 {
            conn.execute_batch(include_str!("../../migrations/001_initial.sql"))
                .unwrap();
            conn.execute_batch(include_str!("../../migrations/002_library.sql"))
                .unwrap();
        }
        let first = r#"{"version":2,"matches":[],"facts":[],"analyses":{},"notes":{},"recordings":[],"goal":"Revisar"}"#;
        validate(first).unwrap();
        store(&conn, first).unwrap();
        let updated = first.replace("Revisar", "Aprendizado salvo");
        store(&conn, &updated).unwrap();
        let saved: String = conn
            .query_row("SELECT payload FROM library WHERE id=1", [], |r| r.get(0))
            .unwrap();
        assert_eq!(saved, updated);
        assert_eq!(
            conn.query_row("SELECT count(*) FROM library", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
    #[test]
    fn rejects_invalid_or_secret_containing_payloads() {
        assert!(validate("not json").is_err());
        assert!(validate(r#"{"version":2,"matches":[],"facts":[],"analyses":{},"notes":{"test":"RGAPI-placeholder"}}"#).is_err());
    }
}

use crate::{persistence::connection, AppState};
use rusqlite::OptionalExtension;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use std::{sync::atomic::Ordering, time::Duration};
use tauri::State;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RiotAccount {
    puuid: String,
    game_name: String,
    tag_line: String,
}
#[derive(Deserialize)]
struct MatchResponse {
    info: MatchInfo,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MatchInfo {
    game_start_timestamp: i64,
    game_duration: u64,
    queue_id: u64,
    participants: Vec<Participant>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Participant {
    puuid: String,
    participant_id: u64,
    champion_name: String,
    #[serde(default)]
    team_position: String,
    team_id: u64,
    win: bool,
    kills: u64,
    deaths: u64,
    assists: u64,
    total_minions_killed: u64,
    neutral_minions_killed: u64,
    #[serde(default)]
    game_ended_in_early_surrender: bool,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchSummary {
    id: String,
    started_at: String,
    duration_seconds: u64,
    queue: String,
    champion: String,
    role: String,
    opponent: String,
    result: String,
    kda: String,
    cs: u64,
    source: String,
    analyzed: bool,
    participant_id: u64,
    opponent_participant_id: Option<u64>,
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    account: RiotAccount,
    matches: Vec<MatchSummary>,
    synced_at: String,
}

fn error_message(status: reqwest::StatusCode, retry: Option<&str>) -> String {
    match status.as_u16() {
        401 | 403 => {
            "A Riot recusou esta chave. Confira a chave no portal e tente novamente.".into()
        }
        404 => "A Riot não encontrou essa conta ou partida. Confira Nome#Tag.".into(),
        429 => format!(
            "Limite de consultas da Riot. Aguarde {} segundos e tente novamente.",
            retry.unwrap_or("120")
        ),
        500..=599 => "A Riot está temporariamente indisponível. Tente mais tarde.".into(),
        _ => format!(
            "Não foi possível consultar a Riot (HTTP {}).",
            status.as_u16()
        ),
    }
}
async fn get<T: DeserializeOwned>(
    client: &reqwest::Client,
    path: &str,
    key: &str,
) -> Result<T, String> {
    let response = client
        .get(format!("https://americas.api.riotgames.com{path}"))
        .header("X-Riot-Token", key)
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "A Riot demorou para responder. Tente novamente.".to_string()
            } else {
                "Não foi possível conectar à Riot. Confira sua internet.".into()
            }
        })?;
    if !response.status().is_success() {
        return Err(error_message(
            response.status(),
            response
                .headers()
                .get("Retry-After")
                .and_then(|v| v.to_str().ok()),
        ));
    }
    response
        .json()
        .await
        .map_err(|_| "A resposta da Riot veio em um formato inesperado. Tente novamente.".into())
}
fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(25))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Não foi possível preparar a conexão.".into())
}
fn summary(id: String, info: MatchInfo, puuid: &str) -> Result<MatchSummary, String> {
    let player = info
        .participants
        .iter()
        .find(|p| p.puuid == puuid)
        .ok_or("Jogador ausente na partida.")?;
    let opponent = if player.team_position.is_empty() {
        None
    } else {
        info.participants
            .iter()
            .find(|p| p.team_id != player.team_id && p.team_position == player.team_position)
    };
    let queue = match info.queue_id {
        420 => "Ranqueada solo/duo".into(),
        440 => "Ranqueada flex".into(),
        400 => "Normal draft".into(),
        450 => "ARAM".into(),
        n => format!("Fila {n}"),
    };
    Ok(MatchSummary {
        id,
        started_at: chrono::DateTime::from_timestamp_millis(info.game_start_timestamp)
            .ok_or("Data inválida na partida.")?
            .to_rfc3339(),
        duration_seconds: info.game_duration,
        queue,
        champion: player.champion_name.clone(),
        role: player.team_position.clone(),
        opponent: opponent
            .map(|p| p.champion_name.clone())
            .unwrap_or_else(|| "Não identificado".into()),
        result: if player.game_ended_in_early_surrender && info.game_duration < 300 {
            "remake"
        } else if player.win {
            "win"
        } else {
            "loss"
        }
        .into(),
        kda: format!("{} / {} / {}", player.kills, player.deaths, player.assists),
        cs: player.total_minions_killed + player.neutral_minions_killed,
        source: "riot-api".into(),
        analyzed: false,
        participant_id: player.participant_id,
        opponent_participant_id: opponent.map(|p| p.participant_id),
    })
}
#[tauri::command]
pub async fn riot_sync_matches(
    state: State<'_, AppState>,
    game_name: String,
    tag_line: String,
    api_key: String,
    count: u8,
) -> Result<SyncResult, String> {
    if state.focus_active.load(Ordering::SeqCst) {
        return Err("Feche o painel de foco antes de sincronizar.".into());
    }
    let key = api_key.trim();
    if key.is_empty() || game_name.trim().is_empty() || tag_line.trim().is_empty() {
        return Err("Preencha seu Nome, Tag e chave Riot.".into());
    }
    let client = client()?;
    let path = format!(
        "/riot/account/v1/accounts/by-riot-id/{}/{}",
        urlencoding::encode(game_name.trim()),
        urlencoding::encode(tag_line.trim())
    );
    let account: RiotAccount = get(&client, &path, key).await?;
    let ids: Vec<String> = get(
        &client,
        &format!(
            "/lol/match/v5/matches/by-puuid/{}/ids?start=0&count={}",
            account.puuid,
            count.clamp(1, 20)
        ),
        key,
    )
    .await?;
    let mut matches = Vec::new();
    for id in ids {
        let payload: MatchResponse =
            get(&client, &format!("/lol/match/v5/matches/{id}"), key).await?;
        matches.push(summary(id, payload.info, &account.puuid)?);
        tokio::time::sleep(Duration::from_millis(650)).await;
    }
    *state.riot_key.lock().map_err(|_| "Conexão ocupada")? = Some(key.to_string());
    Ok(SyncResult {
        account,
        matches,
        synced_at: chrono::Utc::now().to_rfc3339(),
    })
}
#[tauri::command]
pub async fn riot_timeline(
    state: State<'_, AppState>,
    match_id: String,
) -> Result<serde_json::Value, String> {
    if state.focus_active.load(Ordering::SeqCst) {
        return Err("Feche o painel de foco antes de analisar.".into());
    }
    if match_id.len() > 50
        || !match_id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'_')
    {
        return Err("ID de partida inválido.".into());
    }
    let cached: Option<String> = connection(&state)
        .map_err(|_| "Banco local indisponível.")?
        .query_row(
            "SELECT payload FROM timeline_cache WHERE match_id=?1",
            [&match_id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|_| "Falha ao ler Timeline local.")?;
    if let Some(payload) = cached {
        return serde_json::from_str(&payload).map_err(|_| "Timeline local ilegível.".into());
    }
    let key = state.riot_key.lock().map_err(|_| "Conexão ocupada")?.clone().ok_or("Conecte a Riot em Configurações para buscar esta Timeline. As revisões salvas continuam disponíveis.")?;
    let result: serde_json::Value = get(
        &client()?,
        &format!("/lol/match/v5/matches/{match_id}/timeline"),
        &key,
    )
    .await?;
    if !result["info"]["frames"].is_array() {
        return Err("Timeline sem eventos válidos.".into());
    }
    connection(&state)
        .map_err(|_| "Banco local indisponível.")?
        .execute(
            "INSERT OR REPLACE INTO timeline_cache (match_id,payload) VALUES (?1,?2)",
            [&match_id, &result.to_string()],
        )
        .map_err(|_| "Falha ao salvar Timeline.")?;
    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn opponent_is_from_same_lane_not_first_enemy() {
        let player = |id, team, role: &str, puuid: &str| Participant {
            participant_id: id,
            team_id: team,
            team_position: role.into(),
            puuid: puuid.into(),
            champion_name: role.into(),
            win: true,
            kills: 1,
            deaths: 2,
            assists: 3,
            total_minions_killed: 100,
            neutral_minions_killed: 4,
            game_ended_in_early_surrender: false,
        };
        let info = MatchInfo {
            game_start_timestamp: 100000,
            game_duration: 1200,
            queue_id: 420,
            participants: vec![
                player(1, 100, "TOP", "me"),
                player(6, 200, "JUNGLE", "enemy1"),
                player(7, 200, "TOP", "enemy2"),
            ],
        };
        let result = summary("BR1_1".into(), info, "me").unwrap();
        assert_eq!(result.opponent_participant_id, Some(7));
        assert_eq!(result.cs, 104);
    }
    #[test]
    fn rate_limit_gives_retry_guidance() {
        assert!(error_message(reqwest::StatusCode::TOO_MANY_REQUESTS, Some("25")).contains("25"));
    }
}

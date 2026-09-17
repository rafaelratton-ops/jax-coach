use chrono::Utc;
use reqwest::Client;
use serde::Serialize;
use serde_json::Value;
use std::{collections::BTreeMap, time::Duration};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveMatchContext {
    pub captured_at: String,
    pub connected: bool,
    pub game_mode: Option<String>,
    pub champion: Option<String>,
    pub role: Option<String>,
    pub opponent_champion: Option<String>,
    pub warnings: Vec<String>,
}

/// Dados completos ficam disponíveis somente para uma consulta manual no Diagnóstico.
/// Eles não são enviados ao painel de foco nem ao provedor de IA.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveDiagnostics {
    pub captured_at: String,
    pub connected: bool,
    pub endpoints: BTreeMap<String, Value>,
    pub warnings: Vec<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LiveSafeItem {
    pub id: Option<i64>,
    pub name: Option<String>,
    pub count: Option<i64>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LiveSafeScores {
    pub kills: Option<i64>,
    pub deaths: Option<i64>,
    pub assists: Option<i64>,
    pub creep_score: Option<i64>,
    pub ward_score: Option<f64>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LiveSafePlayer {
    pub champion: Option<String>,
    pub role: Option<String>,
    pub team: Option<String>,
    pub level: Option<i64>,
    pub items: Vec<LiveSafeItem>,
    pub scores: Option<LiveSafeScores>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LiveSafeSnapshot {
    pub captured_at: String,
    pub connected: bool,
    pub game_mode: Option<String>,
    pub game_time_seconds: Option<f64>,
    pub own: Option<LiveSafePlayer>,
    pub lane_opponent: Option<LiveSafePlayer>,
    pub warnings: Vec<String>,
}

const ENDPOINTS: [&str; 7] = [
    "/liveclientdata/allgamedata",
    "/liveclientdata/gamestats",
    "/liveclientdata/activeplayer",
    "/liveclientdata/activeplayerabilities",
    "/liveclientdata/activeplayerrunes",
    "/liveclientdata/playerlist",
    "/liveclientdata/eventdata",
];

fn local_client() -> Result<Client, String> {
    Client::builder()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|_| "Não foi possível preparar a leitura local.".to_string())
}

async fn read_endpoint(client: &Client, path: &str) -> Result<Value, String> {
    client
        .get(format!("https://127.0.0.1:2999{path}"))
        .send()
        .await
        .map_err(|_| "O League Client não respondeu na porta local 2999.".to_string())?
        .error_for_status()
        .map_err(|_| "O League Client recusou a leitura local.".to_string())?
        .json()
        .await
        .map_err(|_| "O League Client devolveu um formato inesperado.".to_string())
}

fn player_identifier(player: &Value) -> Option<&str> {
    ["riotId", "riotIdGameName", "summonerName"]
        .iter()
        .find_map(|key| player.get(*key).and_then(Value::as_str))
}

fn same_player(player: &Value, active: &Value) -> bool {
    ["riotId", "riotIdGameName", "summonerName"]
        .iter()
        .filter_map(|key| active.get(*key).and_then(Value::as_str))
        .any(|active_id| player_identifier(player) == Some(active_id))
}

fn string_field(value: &Value, key: &str) -> Option<String> {
    value.get(key).and_then(Value::as_str).map(str::to_string)
}

fn integer_field(value: &Value, key: &str) -> Option<i64> {
    value.get(key).and_then(Value::as_i64)
}

fn number_field(value: &Value, key: &str) -> Option<f64> {
    value.get(key).and_then(Value::as_f64)
}

fn safe_item(item: &Value) -> LiveSafeItem {
    LiveSafeItem {
        id: integer_field(item, "itemID").or_else(|| integer_field(item, "id")),
        name: string_field(item, "displayName").or_else(|| string_field(item, "name")),
        count: integer_field(item, "count"),
    }
}

fn safe_player(player: &Value) -> LiveSafePlayer {
    let items = player
        .get("items")
        .and_then(Value::as_array)
        .map(|values| values.iter().map(safe_item).collect())
        .unwrap_or_default();
    let scores = player.get("scores").map(|value| LiveSafeScores {
        kills: integer_field(value, "kills"),
        deaths: integer_field(value, "deaths"),
        assists: integer_field(value, "assists"),
        creep_score: integer_field(value, "creepScore"),
        ward_score: number_field(value, "wardScore"),
    });
    LiveSafePlayer {
        champion: string_field(player, "championName"),
        role: string_field(player, "position"),
        team: string_field(player, "team"),
        level: integer_field(player, "level"),
        items,
        scores,
    }
}

#[tauri::command]
pub async fn live_match_context() -> Result<LiveMatchContext, String> {
    let captured_at = Utc::now().to_rfc3339();
    let client = local_client()?;
    let game_stats = match read_endpoint(&client, "/liveclientdata/gamestats").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveMatchContext {
                captured_at,
                connected: false,
                game_mode: None,
                champion: None,
                role: None,
                opponent_champion: None,
                warnings: vec![reason],
            })
        }
    };
    let active = match read_endpoint(&client, "/liveclientdata/activeplayer").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveMatchContext {
                captured_at,
                connected: false,
                game_mode: string_field(&game_stats, "gameMode"),
                champion: None,
                role: None,
                opponent_champion: None,
                warnings: vec![reason],
            })
        }
    };
    let players = match read_endpoint(&client, "/liveclientdata/playerlist").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveMatchContext {
                captured_at,
                connected: false,
                game_mode: string_field(&game_stats, "gameMode"),
                champion: None,
                role: None,
                opponent_champion: None,
                warnings: vec![reason],
            })
        }
    };
    let player_list = players
        .as_array()
        .ok_or_else(|| "O League Client devolveu uma lista de jogadores inválida.".to_string())?;
    let own = player_list
        .iter()
        .find(|player| same_player(player, &active));
    let champion = own.and_then(|player| string_field(player, "championName"));
    let role = own.and_then(|player| string_field(player, "position"));
    let team = own.and_then(|player| string_field(player, "team"));
    let opponent_champion = own.and_then(|player| {
        let position = string_field(player, "position");
        player_list.iter().find_map(|candidate| {
            let candidate_team = string_field(candidate, "team");
            let candidate_position = string_field(candidate, "position");
            if candidate_team.is_some()
                && candidate_team != team
                && position.is_some()
                && candidate_position == position
            {
                string_field(candidate, "championName")
            } else {
                None
            }
        })
    });
    Ok(LiveMatchContext {
        captured_at,
        connected: own.is_some(),
        game_mode: string_field(&game_stats, "gameMode"),
        champion,
        role,
        opponent_champion,
        warnings: if own.is_some() {
            Vec::new()
        } else {
            vec!["Não foi possível identificar seu jogador na lista local.".to_string()]
        },
    })
}

/// Leitura periódica opt-in para o segundo monitor. Retorna apenas fatos resumidos,
/// sem eventos, cooldowns, vida, ouro, runas ou respostas brutas do League Client.
#[tauri::command]
pub async fn live_safe_snapshot() -> Result<LiveSafeSnapshot, String> {
    let captured_at = Utc::now().to_rfc3339();
    let client = local_client()?;
    let game_stats = match read_endpoint(&client, "/liveclientdata/gamestats").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveSafeSnapshot {
                captured_at,
                connected: false,
                game_mode: None,
                game_time_seconds: None,
                own: None,
                lane_opponent: None,
                warnings: vec![reason],
            })
        }
    };
    let active = match read_endpoint(&client, "/liveclientdata/activeplayer").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveSafeSnapshot {
                captured_at,
                connected: false,
                game_mode: string_field(&game_stats, "gameMode"),
                game_time_seconds: number_field(&game_stats, "gameTime"),
                own: None,
                lane_opponent: None,
                warnings: vec![reason],
            })
        }
    };
    let players = match read_endpoint(&client, "/liveclientdata/playerlist").await {
        Ok(value) => value,
        Err(reason) => {
            return Ok(LiveSafeSnapshot {
                captured_at,
                connected: false,
                game_mode: string_field(&game_stats, "gameMode"),
                game_time_seconds: number_field(&game_stats, "gameTime"),
                own: None,
                lane_opponent: None,
                warnings: vec![reason],
            })
        }
    };
    let player_list = players
        .as_array()
        .ok_or_else(|| "O League Client devolveu uma lista de jogadores inválida.".to_string())?;
    let own = player_list
        .iter()
        .find(|player| same_player(player, &active));
    let lane_opponent = own.and_then(|player| {
        let own_team = string_field(player, "team");
        let own_position = string_field(player, "position");
        player_list.iter().find(|candidate| {
            string_field(candidate, "team").is_some()
                && string_field(candidate, "team") != own_team
                && own_position.is_some()
                && string_field(candidate, "position") == own_position
        })
    });
    Ok(LiveSafeSnapshot {
        captured_at,
        connected: own.is_some(),
        game_mode: string_field(&game_stats, "gameMode"),
        game_time_seconds: number_field(&game_stats, "gameTime"),
        own: own.map(safe_player),
        lane_opponent: lane_opponent.map(safe_player),
        warnings: if own.is_some() {
            Vec::new()
        } else {
            vec!["Não foi possível identificar seu jogador na lista local.".to_string()]
        },
    })
}

#[tauri::command]
pub async fn live_diagnostics() -> Result<LiveDiagnostics, String> {
    let captured_at = Utc::now().to_rfc3339();
    let client = local_client()?;
    let mut endpoints = BTreeMap::new();
    let mut warnings = Vec::new();
    for path in ENDPOINTS {
        match read_endpoint(&client, path).await {
            Ok(value) => {
                endpoints.insert(
                    path.trim_start_matches("/liveclientdata/").to_string(),
                    value,
                );
            }
            Err(reason) => warnings.push(format!("{path}: {reason}")),
        }
    }
    Ok(LiveDiagnostics {
        captured_at,
        connected: !endpoints.is_empty(),
        endpoints,
        warnings,
    })
}

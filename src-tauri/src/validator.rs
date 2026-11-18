// validator.rs - Risoluzione batch non-distruttiva dei brani e Self-Healing dei percorsi
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Richiesta per la verifica di una singola traccia della playlist o coda
#[derive(Deserialize, Clone, Debug)]
pub struct TrackResolveInput {
    pub path: String,
    pub cover: Option<String>,
}

/// Esito della verifica e dell'eventuale rilocazione cross-folder
#[derive(Serialize, Clone, Debug, PartialEq, Eq)]
pub struct TrackResolveOutput {
    pub exists: bool,
    pub resolved_path: String,
    pub resolved_cover: Option<String>,
    pub relocated: bool,
}

/// Estrae nome file e nome cartella padre gestendo sia '/' (POSIX) che '\' (Windows)
pub fn extract_name_and_parent(raw_path: &str) -> (String, Option<String>) {
    let parts: Vec<&str> = raw_path
        .split(['/', '\\'])
        .filter(|s| !s.is_empty())
        .collect();
    let file_name = parts.last().map(|s| s.to_lowercase()).unwrap_or_default();
    let parent_name = if parts.len() >= 2 {
        Some(parts[parts.len() - 2].to_lowercase())
    } else {
        None
    };
    (file_name, parent_name)
}

/// Disambigua eventuali omonimi dando priorita' al match sulla cartella padre originale
fn pick_best_candidate<'a>(candidates: &'a [PathBuf], old_parent: Option<&str>) -> Option<&'a PathBuf> {
    if let Some(target_parent) = old_parent {
        if let Some(matched) = candidates.iter().find(|p| {
            p.parent()
                .and_then(|d| d.file_name())
                .map(|n| n.to_string_lossy().to_lowercase() == target_parent)
                .unwrap_or(false)
        }) {
            return Some(matched);
        }
    }
    candidates.first()
}

/// Riallinea il percorso della copertina quando il file audio viene ritrovato altrove
fn resolve_cover_path(old_cover: Option<&str>, old_path: &str, new_path: &Path) -> Option<String> {
    match old_cover {
        Some(c) if c == old_path => Some(new_path.to_string_lossy().to_string()),
        Some(c) if Path::new(c).is_file() => Some(c.to_string()),
        _ => new_path.parent().and_then(crate::metadata::find_cover_art),
    }
}

/// Esegue Fase 1 (stat diretto) e Fase 2 (fallback a livelli con early-exit)
pub fn resolve_tracks_with_roots(
    tracks: &[TrackResolveInput],
    roots: &[(PathBuf, usize)],
) -> Vec<TrackResolveOutput> {
    let mut outputs = Vec::with_capacity(tracks.len());
    let mut missing_indices = Vec::new();

    // Fase 1: controllo immediato sui path salvati senza scansionare cartelle
    for (idx, tr) in tracks.iter().enumerate() {
        if !tr.path.is_empty() && Path::new(&tr.path).is_file() {
            outputs.push(TrackResolveOutput {
                exists: true,
                resolved_path: tr.path.clone(),
                resolved_cover: tr.cover.clone(),
                relocated: false,
            });
        } else {
            outputs.push(TrackResolveOutput {
                exists: false,
                resolved_path: tr.path.clone(),
                resolved_cover: tr.cover.clone(),
                relocated: false,
            });
            missing_indices.push(idx);
        }
    }

    if missing_indices.is_empty() || roots.is_empty() {
        return outputs;
    }

    // Fase 2: cerca i soli brani assenti per radici ordinate e si ferma appena risolti
    for (root, max_depth) in roots {
        if missing_indices.is_empty() {
            break;
        }
        let index = crate::validator_index::get_or_build_index(root, *max_depth);
        missing_indices.retain(|&idx| {
            let (file_name, old_parent) = extract_name_and_parent(&tracks[idx].path);
            if file_name.is_empty() {
                return false;
            }
            if let Some(candidates) = index.get(&file_name) {
                if let Some(best) = pick_best_candidate(candidates, old_parent.as_deref()) {
                    let new_path_str = best.to_string_lossy().to_string();
                    let new_cover = resolve_cover_path(
                        tracks[idx].cover.as_deref(),
                        &tracks[idx].path,
                        best,
                    );
                    outputs[idx] = TrackResolveOutput {
                        exists: true,
                        resolved_path: new_path_str,
                        resolved_cover: new_cover,
                        relocated: true,
                    };
                    return false;
                }
            }
            true
        });
    }

    outputs
}

/// Comando IPC asincrono: esegue l'I/O su thread dedicato per non bloccare mai la UI
#[tauri::command]
pub async fn resolve_tracks_batch(
    app: tauri::AppHandle,
    tracks: Vec<TrackResolveInput>,
    last_folder: Option<String>,
) -> Vec<TrackResolveOutput> {
    tokio::task::spawn_blocking(move || {
        let roots = crate::validator_index::build_search_roots(&app, last_folder.as_deref());
        resolve_tracks_with_roots(&tracks, &roots)
    })
    .await
    .unwrap_or_default()
}

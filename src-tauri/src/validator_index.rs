// validator_index.rs - Indicizzazione leggera con cache TTL per il fallback cross-folder
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
#[cfg(not(target_os = "android"))]
use tauri::Manager;

/// Durata della cache in RAM per evitare scansioni ripetute su click ravvicinati
const INDEX_TTL: Duration = Duration::from_secs(20);
const MAX_CACHED_ROOTS: usize = 12;

struct CachedRoot {
    indexed_at: Instant,
    max_depth: usize,
    files: HashMap<String, Vec<PathBuf>>,
}

static ROOT_CACHE: OnceLock<Mutex<HashMap<PathBuf, CachedRoot>>> = OnceLock::new();

fn cache() -> &'static Mutex<HashMap<PathBuf, CachedRoot>> {
    ROOT_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Esclude sottocartelle nascoste o di sistema molto pesanti (es. Android/, DCIM/)
fn should_skip_dir(name: &str) -> bool {
    if name.starts_with('.') {
        return true;
    }
    matches!(
        name.to_lowercase().as_str(),
        "android" | "dcim" | "pictures" | "movies" | "node_modules"
    )
}

/// Attraversa la cartella senza leggere i tag ID3: usa solo d_type ed estensione file
fn visit_dir(dir: &Path, depth: usize, max_depth: usize, out: &mut HashMap<String, Vec<PathBuf>>) {
    let Ok(entries) = fs::read_dir(dir) else { return; };
    for entry in entries.flatten() {
        let Ok(ft) = entry.file_type() else { continue; };
        if ft.is_symlink() {
            continue;
        }
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if ft.is_dir() {
            if depth < max_depth && !should_skip_dir(&name) {
                visit_dir(&path, depth + 1, max_depth, out);
            }
        } else if ft.is_file() {
            let is_audio = path
                .extension()
                .and_then(|e| e.to_str())
                .map(crate::metadata::is_audio)
                .unwrap_or(false);
            if is_audio {
                out.entry(name.to_lowercase()).or_default().push(path);
            }
        }
    }
}

/// Restituisce l'indice nome_file -> percorsi dalla cache TTL o lo costruisce su disco
pub fn get_or_build_index(root: &Path, max_depth: usize) -> HashMap<String, Vec<PathBuf>> {
    let key = fs::canonicalize(root).unwrap_or_else(|_| root.to_path_buf());
    if let Ok(guard) = cache().lock() {
        if let Some(entry) = guard.get(&key) {
            if entry.indexed_at.elapsed() < INDEX_TTL && entry.max_depth >= max_depth {
                return entry.files.clone();
            }
        }
    }

    let mut files = HashMap::new();
    if root.is_dir() {
        visit_dir(root, 0, max_depth, &mut files);
    }

    if let Ok(mut guard) = cache().lock() {
        if guard.len() >= MAX_CACHED_ROOTS {
            guard.clear();
        }
        guard.insert(
            key,
            CachedRoot { indexed_at: Instant::now(), max_depth, files: files.clone() },
        );
    }
    files
}

fn push_unique_root(
    roots: &mut Vec<(PathBuf, usize)>,
    seen: &mut HashSet<PathBuf>,
    path: PathBuf,
    depth: usize,
) {
    if !path.is_dir() {
        return;
    }
    let canon = fs::canonicalize(&path).unwrap_or_else(|_| path.clone());
    if seen.insert(canon) {
        roots.push((path, depth));
    }
}

/// Costruisce la lista ordinata e deduplicata delle cartelle di ricerca per il fallback
pub fn build_search_roots(app: &tauri::AppHandle, last_folder: Option<&str>) -> Vec<(PathBuf, usize)> {
    let mut roots = Vec::new();
    let mut seen = HashSet::new();

    #[cfg(not(target_os = "android"))]
    let home_dir = app.path().home_dir().ok().and_then(|p| fs::canonicalize(p).ok());

    if let Some(lf) = last_folder.filter(|s| !s.is_empty()) {
        let p = PathBuf::from(lf);
        let canon = fs::canonicalize(&p).unwrap_or_else(|_| p.clone());
        #[cfg(target_os = "android")]
        let depth = if canon == Path::new("/storage/emulated/0") { 2 } else { 6 };
        #[cfg(not(target_os = "android"))]
        let depth = if home_dir.as_ref() == Some(&canon) { 2 } else { 6 };
        push_unique_root(&mut roots, &mut seen, p, depth);
    }

    #[cfg(target_os = "android")]
    {
        let _ = app;
        push_unique_root(&mut roots, &mut seen, PathBuf::from("/storage/emulated/0/Music"), 6);
        push_unique_root(&mut roots, &mut seen, PathBuf::from("/storage/emulated/0/Download"), 2);
    }
    #[cfg(not(target_os = "android"))]
    {
        if let Ok(music) = app.path().audio_dir() {
            push_unique_root(&mut roots, &mut seen, music, 6);
        }
        if let Ok(dl) = app.path().download_dir() {
            push_unique_root(&mut roots, &mut seen, dl, 2);
        }
    }
    roots
}

// src-tauri/src/metadata.rs - Estrazione dei tag audio (ID3/Vorbis/FLAC), cover ed euristica
use audiotags::Tag;
use std::fs;
use std::path::Path;

pub struct AudioMetadata {
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub has_cover: bool,
}

pub fn is_audio(ext: &str) -> bool {
    matches!(ext.to_lowercase().as_str(), "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac")
}

pub fn find_cover_art(parent: &Path) -> Option<String> {
    if let Ok(entries) = fs::read_dir(parent) {
        let mut fallback = None;
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Some(ext) = p.extension() {
                    let ext_lower = ext.to_string_lossy().to_lowercase();
                    if matches!(ext_lower.as_str(), "jpg" | "jpeg" | "png" | "webp" | "bmp") {
                        let stem = p.file_stem().unwrap_or_default().to_string_lossy().to_lowercase();
                        if matches!(stem.as_str(), "cover" | "folder" | "album" | "front" | "art") {
                            return Some(p.to_string_lossy().to_string());
                        }
                        if fallback.is_none() { fallback = Some(p.to_string_lossy().to_string()); }
                    }
                }
            }
        }
        return fallback;
    }
    None
}

pub fn extract_metadata(path: &Path) -> AudioMetadata {
    let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();

    if let Ok(tag) = Tag::new().read_from_path(path) {
        let tag_title = tag.title().map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
        let tag_artist = tag.artist().map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
        let tag_album = tag.album_title().map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
        let has_cover = tag.album_cover().is_some();

        let artist = tag_artist
            .or_else(|| parse_artist_title(&stem).map(|(a, _)| a))
            .or_else(|| get_folder_artist(path));
        let album = tag_album.or_else(|| get_parent_dir_name(path));

        if tag_title.is_some() || artist.is_some() || album.is_some() {
            return AudioMetadata {
                title: tag_title.unwrap_or(stem),
                artist,
                album,
                has_cover,
            };
        }
    }

    if let Some((artist, title)) = parse_artist_title(&stem) {
        return AudioMetadata {
            title,
            artist: Some(artist),
            album: get_parent_dir_name(path),
            has_cover: false,
        };
    }

    AudioMetadata {
        title: stem,
        artist: get_folder_artist(path),
        album: get_parent_dir_name(path),
        has_cover: false,
    }
}

fn get_parent_dir_name(path: &Path) -> Option<String> {
    path.parent()
        .and_then(|p| p.file_name())
        .map(|s| s.to_string_lossy().trim().to_string())
        .filter(|s| !s.is_empty() && s != "Music" && s != "Download" && s != "Musica" && s != "0")
}

fn get_folder_artist(path: &Path) -> Option<String> {
    path.parent()
        .and_then(|p| p.parent())
        .and_then(|p| p.file_name())
        .map(|s| s.to_string_lossy().trim().to_string())
        .filter(|s| !s.is_empty() && s != "Music" && s != "Download" && s != "Musica" && s != "0")
}

fn parse_artist_title(stem: &str) -> Option<(String, String)> {
    let cleaned = stem.trim_start_matches(|c: char| c.is_ascii_digit() || c == '.' || c == '-' || c == ' ');
    let parts: Vec<&str> = cleaned.split(" - ").collect();
    if parts.len() >= 2 {
        let artist = parts[0].trim().to_string();
        let title = parts[1..].join(" - ").trim().to_string();
        if !artist.is_empty() && !title.is_empty() {
            return Some((artist, title));
        }
    }
    None
}

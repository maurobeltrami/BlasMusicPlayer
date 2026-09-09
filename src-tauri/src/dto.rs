// dto.rs - Modelli dati per il trasferimento IPC tra Rust e interfaccia grafica
use serde::{Deserialize, Serialize};

/// DTO per una singola traccia audio con metadati ID3 e copertina
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TrackDto {
    pub title: String,
    pub artist: Option<String>,
    pub path: String,
    pub extension: String,
    pub cover: Option<String>,
}

/// DTO per il risultato della scansione di una cartella musicale
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FolderResultDto {
    pub folder_path: String,
    pub tracks: Vec<TrackDto>,
}

/// DTO per un elemento del filesystem (file audio o cartella)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileItemDto {
    pub name: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub path: String,
    pub is_dir: bool,
    pub cover: Option<String>,
}

/// DTO per una scorciatoia a una cartella di sistema (Download, Musica, ecc.)
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CommonDirDto {
    pub name: String,
    pub path: String,
    pub icon: String,
}

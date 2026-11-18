// validator_tests.rs - Test automatici per validazione non-distruttiva e rilocazione brani
use app_lib::validator::{extract_name_and_parent, resolve_tracks_with_roots, TrackResolveInput};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

/// Crea una directory temporanea isolata per ciascun test
fn make_temp_dir(label: &str) -> PathBuf {
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
    let dir = std::env::temp_dir().join(format!("blas_validator_{}_{}", label, nanos));
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn fast_path_preserva_tracce_esistenti_e_segna_assenti() {
    let dir = make_temp_dir("fast_path");
    let ok_file = dir.join("brano_valido.mp3");
    fs::write(&ok_file, b"dummy").unwrap();
    let missing = dir.join("eliminato.mp3");

    let inputs = vec![
        TrackResolveInput {
            path: ok_file.to_string_lossy().into(),
            cover: Some(ok_file.to_string_lossy().into()),
        },
        TrackResolveInput {
            path: missing.to_string_lossy().into(),
            cover: None,
        },
    ];

    let out = resolve_tracks_with_roots(&inputs, &[]);
    assert_eq!(out.len(), 2);
    assert!(out[0].exists && !out[0].relocated);
    assert_eq!(out[0].resolved_path, ok_file.to_string_lossy());
    assert!(!out[1].exists && !out[1].relocated);

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn fallback_riloca_brano_spostato_e_aggiorna_cover_embedded() {
    let dir = make_temp_dir("relocate");
    let new_album = dir.join("NuovaMusica").join("Rock");
    fs::create_dir_all(&new_album).unwrap();
    let new_file = new_album.join("Queen - Show.flac");
    fs::write(&new_file, b"flac").unwrap();

    let old_path = "/vecchio/mac/Musica/Rock/Queen - Show.flac".to_string();
    let inputs = vec![TrackResolveInput {
        path: old_path.clone(),
        cover: Some(old_path),
    }];

    let out = resolve_tracks_with_roots(&inputs, &[(dir.clone(), 6)]);
    assert_eq!(out.len(), 1);
    assert!(out[0].exists);
    assert!(out[0].relocated);
    assert_eq!(out[0].resolved_path, new_file.to_string_lossy());
    assert_eq!(out[0].resolved_cover.as_deref(), Some(new_file.to_string_lossy().as_ref()));

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn disambigua_omonimi_con_cartella_padre_e_ignora_cartelle_nascoste() {
    let dir = make_temp_dir("disambiguate");
    let album_a = dir.join("AlbumA");
    let album_b = dir.join("AlbumB");
    let hidden = dir.join(".Trash");
    let android_dir = dir.join("Android");
    fs::create_dir_all(&album_a).unwrap();
    fs::create_dir_all(&album_b).unwrap();
    fs::create_dir_all(&hidden).unwrap();
    fs::create_dir_all(&android_dir).unwrap();

    let file_a = album_a.join("01.mp3");
    let file_b = album_b.join("01.mp3");
    fs::write(&file_a, b"a").unwrap();
    fs::write(&file_b, b"b").unwrap();
    fs::write(hidden.join("segreto.mp3"), b"h").unwrap();
    fs::write(android_dir.join("sistema.mp3"), b"s").unwrap();
    fs::write(dir.join("note.txt"), b"txt").unwrap();

    let inputs = vec![
        TrackResolveInput { path: "C:\\Music\\AlbumB\\01.mp3".into(), cover: None },
        TrackResolveInput { path: "/old/segreto.mp3".into(), cover: None },
        TrackResolveInput { path: "/old/sistema.mp3".into(), cover: None },
        TrackResolveInput { path: "/old/note.txt".into(), cover: None },
    ];

    let out = resolve_tracks_with_roots(&inputs, &[(dir.clone(), 4)]);
    assert!(out[0].exists && out[0].relocated);
    assert_eq!(out[0].resolved_path, file_b.to_string_lossy());
    assert!(!out[1].exists);
    assert!(!out[2].exists);
    assert!(!out[3].exists);

    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn estrazione_nome_e_parent_gestisce_posix_e_windows() {
    assert_eq!(
        extract_name_and_parent("/storage/emulated/0/Music/Rock/Brano.MP3"),
        ("brano.mp3".into(), Some("rock".into()))
    );
    assert_eq!(
        extract_name_and_parent("D:\\Audio\\Jazz\\Track.ogg"),
        ("track.ogg".into(), Some("jazz".into()))
    );
}

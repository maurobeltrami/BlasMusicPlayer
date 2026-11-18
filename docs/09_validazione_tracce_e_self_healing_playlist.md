# 🧩 Lezione 09: Validazione Non-Distruttiva delle Tracce, Fallback Cross-Folder e Self-Healing

Questo documento descrive l'architettura implementata per rendere le playlist di **BlasMusicPlayer** resilienti alla cancellazione, allo spostamento o al cambio parziale dei brani tra dispositivi diversi, senza rallentare smartphone di fascia bassa e senza mostrare errori all'utente.

---

## 1. Separazione tra *Master List* e *Coda Eseguibile*

Nel modello dati Local-First (`app_state.json`), le playlist salvate (`saved_playlists`) archiviano snapshot JSON dei brani (`title`, `path`, `cover`, ...). Se eliminassimo automaticamente un brano da `saved_playlists` appena risulta assente su disco, l'utente perderebbe la composizione della playlist ogni volta che rimuove temporaneamente un file dal telefono.

La soluzione adotta la **Validazione Lazy Non-Distruttiva**:
* **`saved_playlists` (Master List):** conserva sempre l'elenco completo scelto dall'utente; i brani assenti **non vengono mai rimossi**.
* **`currentPlaylist` (Coda di Riproduzione):** viene costruita al volo filtrando la playlist tramite [`trackValidator.js`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src/js/core/trackValidator.js) in ingresso alla coda (avvio app, click su *Play*, *+ Coda* e selettore rapido).
* Se tutti i brani di una playlist selezionata risultano assenti (`0` tracce valide), la coda attiva viene svuotata in silenzio tramite `clearPlaylist()` e [`clearLoadedTrack()`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src/js/core/mediaLoader.js).

---

## 2. Risoluzione a Due Livelli nel Backend Rust (*Two-Tier Resolution*)

Verificare N file uno alla volta da JavaScript introdurrebbe $N$ round-trip IPC oppure connessioni HTTP loopback superflue verso [`server.rs`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src-tauri/src/server.rs). Il controllo viene invece centralizzato in un'unica chiamata batch asincrona `resolve_tracks_batch` in [`validator.rs`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src-tauri/src/validator.rs):

1. **Fase 1 — Fast Path ($O(N)$ syscall `stat` senza lettura byte):**
   * Per ciascun percorso, Rust esegue `Path::new(&path).is_file()`.
   * A livello di sistema operativo interroga esclusivamente i metadati dell'inode (`stat` POSIX) per verificare che il file esista e non sia una directory, **senza aprire lo stream audio né leggere tag ID3**.
   * Se tutti i brani esistono al percorso salvato, il comando termina in pochi millisecondi senza toccare il resto del filesystem.

2. **Fase 2 — Fallback Cross-Folder con *Early-Exit* (`validator_index.rs`):**
   * Scatta **solo se almeno un brano non esiste** al percorso originale (ad esempio perché spostato in un'altra cartella o copiato in una directory diversa su un altro dispositivo).
   * Eseguita dentro `tokio::task::spawn_blocking` su un thread worker dedicato per non bloccare mai la WebView su Android (zero ANR).
   * Scansiona in ordine di priorità `last_folder` → `Musica` (profondità max 6) → `Download` (profondità max 2), saltando directory nascoste (`.`) e cartelle di sistema pesanti (`Android/`, `DCIM/`, `Pictures/`, `Movies/`).
   * Usa `entry.file_type()` (che su Linux/Android sfrutta il campo `d_type` di `getdents64`) e verifica l'estensione con `metadata::is_audio` senza invocare parser ID3.
   * Appena tutti i brani mancanti vengono risolti, la ricerca si interrompe immediatamente (*early-exit*) senza visitare le radici successive.

---

## 3. Disambiguazione degli Omonimi e Cache TTL

* **Disambiguazione:** l'indice associa ogni nome file in minuscolo alla lista dei percorsi candidati (`HashMap<String, Vec<PathBuf>>`). Se esistono più file con lo stesso nome (es. `01.mp3`), `pick_best_candidate()` privilegia il candidato la cui cartella padre coincide con quella del percorso originale.
* **Cache in RAM (TTL 20 secondi):** [`validator_index.rs`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src-tauri/src/validator_index.rs) mantiene in `OnceLock<Mutex<...>>` gli indici per radice con scadenza di 20 secondi. Aperture ravvicinate di playlist diverse nella stessa sessione leggono direttamente dalla RAM senza ripetere I/O su flash eMMC/SD.

---

## 4. *Self-Healing* Selettivo e Gestione Errori in Coda

* **Self-Healing (`stateManager.applySelfHealing`):** quando un brano spostato viene ritrovato in una nuova cartella, `trackValidator.js` aggiorna in silenzio il nuovo `path` (e riallinea `cover` embedded o di cartella) dentro `saved_playlists`. Questo garantisce due vantaggi:
  1. I caricamenti successivi rientrano subito nel **Fast Path** della Fase 1;
  2. La modale `+` ([`playlistModal.js`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src/js/events/playlistModal.js)) continua a riconoscere correttamente l'appartenenza del brano alle playlist.
* **Salto resiliente durante la riproduzione ([`audio.js`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src/js/events/audio.js)):** se un file viene cancellato dal disco *dopo* essere già stato caricato in coda, l'evento `onerror` salta al brano successivo dopo 400 ms fino a un massimo di `currentPlaylist.length` tentativi consecutivi, arrestandosi in modo pulito se nessun brano in coda è riproducibile.

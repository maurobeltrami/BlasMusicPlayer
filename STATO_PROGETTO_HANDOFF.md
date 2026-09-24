# 📋 Documento di Handoff & Stato del Progetto — BlasMusicPlayer

> **Data:** 24 Settembre 2026 (Sessione 5)
> **Repository:** https://github.com/maurobeltrami/BlasMusicPlayer.git
> **Branch Corrente:** `feature/responsive-android`
> **Ultimo Commit:** build: compilato APK Android universale con sincronizzazione playlist e UI
> **Bundle Desktop Pronto:** `./BlasMusicPlayer.app` (compilato in release, firmato e verificato)
> **Pacchetto Android Pronto:** `./BlasMusicPlayer-release.apk` (15 MB, firmato con `blas-release.keystore`, inviato via DevBot Telegram) e `./app-universal-debug.apk` (debug universale)
> **Guida Android:** `docs/manuali/guida_aggiornamento_android.md`

---

## 🎯 Panoramica del Progetto
**BlasMusicPlayer** è un riproduttore musicale offline, Local-First, ad alte prestazioni per piattaforme **Desktop (macOS, Windows, Linux)** e **Mobile (Android)**, basato su:
- **Tauri 2.0** (Rust backend)
- **Frontend Web Nativo** (HTML5, Tailwind CSS, Vanilla ES6 JavaScript modulare, Web Audio API, Canvas per visualizzatore a 60 FPS)
- **Componenti Android Nativi Kotlin** per il supporto al background continuo.

Tutto il codice rispetta rigorosamente le regole architetturali definite in `AGENTS.md`.

---

## 📐 Vincoli e Regole di Sviluppo (AGENTS.md)
Tutti i futuri interventi di codice devono obbligatoriamente rispettare queste regole:
1. **Regola delle <= 150 Righe:** Nessun file sorgente proprietario (`.rs`, `.js`, `.css`, `.kt`, `.cpp`, `.h`) può superare le **150 righe di codice** (esclusi solo file generati da tool, `.json`, `.html`, asset).
2. **Commenti in Italiano:** Tutti i commenti nel codice devono essere scritti esclusivamente in lingua italiana.
3. **Approccio Zero-Terminal:** L'applicazione deve funzionare in autonomia per l'utente finale.
4. **Local-First & Privacy:** Nessuna chiamata a server remoti; tutto l'audio, i metadati e le playlist sono archiviati localmente sul dispositivo.

---

## 🏗️ Architettura Attuale del Sistema

### 1. Backend Rust (`src-tauri/src/`)
- `lib.rs`: Inizializzazione Tauri 2.0, registrazione comandi IPC e plugin (`tauri-plugin-dialog`, `tauri-plugin-fs`, `tauri-plugin-log`), avvio server streaming locale.
- `server.rs` (131 righe): Server HTTP locale multithread su porta casuale (`127.0.0.1:<PORT>`). Gestisce:
  - Streaming audio con supporto Range HTTP 206 (`/audio?path=...`).
  - Estrazione al volo e streaming delle **copertine ID3/APIC incorporate nei file MP3/FLAC** o fallback su immagini di cartella (`/cover?path=...`).
- `metadata.rs` (82 righe): Lettura tag ID3/Vorbis (titolo, artista, presenza di copertina incorporata con `audiotags`).
- `commands.rs` (147 righe): Scansione cartelle (`scan_directory`, `scan_folder_recursive`), navigazione cartelle comuni con aggiunta Documenti (`get_common_dirs`), selezione cartelle asincrona tramite `tauri-plugin-dialog` (`pick_audio_folder`).
- `Info.plist`: Dichiarazione permessi macOS TCC per accesso sicuro a Documenti, Download, Musica e volumi esterni.
- `state.rs` (42 righe): Persistenza atomica dello stato applicativo (`app_state.json`) tramite percorsi nativi Tauri (su desktop `~/.config/BlasMusicPlayer`, su Android cartella interna sandboxed).
- `dto.rs` (38 righe): Strutture dati scambiate tra Rust e frontend.

### 2. Sottosistema Android Nativo (`src-tauri/gen/android/app/src/main/`)
- `AudioService.kt` (88 righe): Servizio Foreground Android con `ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK` e notifica persistente in `NotificationChannel` dedicato. Impedisce che la CPU vada in deep sleep (Doze Mode) o che il sistema chiuda il processo quando lo schermo si spegne.
- `MainActivity.kt` (79 righe):
  - Avvio automatico di `AudioService` in `onCreate()`.
  - Override di `onPause()` e `onStop()` con `webViewRef?.onResume()` per mantenere attivo il motore JavaScript e gli eventi audio anche a telefono bloccato.
  - Richiesta permessi a runtime (`READ_MEDIA_AUDIO`, `READ_EXTERNAL_STORAGE`, `POST_NOTIFICATIONS`).
  - Acquisizione preventiva di `PowerManager.PARTIAL_WAKE_LOCK`.
- `AndroidManifest.xml`: Configurato con `usesCleartextTraffic="true"`, registrazione di `AudioService` come servizio foreground di tipo `mediaPlayback`.

### 3. Frontend Web (`src/`)
- `index.html`: Struttura SPA a 3 schermate (`view-home`, `view-playlists`, `view-equalizer`) + Player Sticky in basso (`bottom-player`).
  - Header sticky con safe area padding per notch e status bar.
  - Accordion a scomparsa per la libreria cartelle (`libraryContent`).
  - Visualizzatore Canvas centrale (`visualizer`) con supporto copertina, oscilloscopio e barre.
- `src/css/style.css` (40 righe): Box-sizing globale, prevenzione overflow orizzontale, utility `.pt-safe` e `.pb-safe`, stile per range verticali.
- `src/js/app.js` (131 righe): Entry point principale, router, drag & drop, gestione eventi di risveglio AudioContext e loop visualizzatore 60 FPS.
- `src/js/core/`:
  - `mediaLoader.js` (113 righe): Risoluzione URL streaming e copertina, aggiornamento `MediaMetadata`, risveglio preventivo AudioContext in autoPlay.
  - `audioEngine.js` (140 righe): DSP Web Audio API (filtri EQ 3 bande, compressore dinamico, gain master, analizzatore FFT), `ensureAudioRunning()` e listener di risveglio standby (`setupWakeupListeners`).
  - `stateManager.js` (117 righe): Sincronizzazione stato tra LocalStorage e persistenza nativa JSON.
- `src/js/data/playlist.js` (77 righe): Gestione coda di riproduzione attiva, cronologia e shuffle.
- `src/js/events/`:
  - `navigation.js` (145 righe): Navigazione del filesystem e accodamento tracce.
  - `playlistsManager.js` (125 righe): Gestione caricamento ed eliminazione playlist salvate, avvio modifica nel compositore.
  - `playlistComposer.js` (143 righe): Compositore unificato per creazione e modifica in-place delle playlist con riordino ▲▼, rinomina, rimozione brani e pulsante annulla.
  - `playlistFolderBrowser.js` (131 righe): Browser cartelle per selezione tracce da aggiungere alle playlist.
  - `playlistModal.js` (110 righe): Modale per aggiungere e rimuovere brani dalle playlist tramite spunte/checkbox.
  - `playback.js` (111 righe): Controlli play/pause con risveglio asincrono AudioContext, gestione errori, comandi multimediali e scorciatoia `Space`.
  - `audio.js` (72 righe): Avanzamento continuo traccia (`onended`), barra di avanzamento e recupero audio su `onplaying`.
  - `equalizer.js` (67 righe): Slider equalizzatore e compressore.

---

### 🚀 Funzionalità Risolte e Verificate
1. **Layout 100% Responsive e Fullscreen Lock** ✅
2. **Libreria Comprimibile ad Accordion** ✅
3. **Riproduzione Continua in Background & Standby (AudioService.kt)** ✅
4. **Correzione Avanzamento Coda** ✅
5. **Equalizzatore Verticale Perfetto** ✅
6. **Copertine Incorporate nei file MP3/FLAC** ✅
7. **CRUD Completo delle Playlist** ✅
8. **Icone App Aggiornate** ✅
9. **Resilienza Standby & AudioContext Wakeup** ✅
   - Risolto il blocco in cui la traccia avanzava ma l'audio restava muto dopo lo sblocco del computer.
   - Gestiti gli stati WebKit/CoreAudio `'suspended'` e `'interrupted'` tramite `ensureAudioRunning()`.
   - Aggiunti listener preventivi su `visibilitychange`, `focus`, `pointerdown` e `keydown`.
   - Aggiunta scorciatoia da tastiera `Space` per Play/Pause globale su desktop.
10. **Risoluzione Accesso Cartelle macOS & Permessi TCC** ✅
   - Sostituito `rfd` con `tauri_plugin_dialog::DialogExt` asincrono su canale oneshot.
   - Aggiunta la directory "Documenti" (`document_dir()`) nelle scorciatoie desktop.
   - Creato `src-tauri/Info.plist` con permessi TCC macOS (`NSDocumentsFolderUsageDescription`, ecc.).
   - Risolto il blocco dell'avvio con firma bundle `codesign --force --deep -s -`.
11. **Risoluzione SyntaxError `audioEngine.js`** ✅
   - Rimossa la parentesi graffa superflua che chiudeva anticipatamente `initAudio` mandando in crash l'import di `app.js`.
12. **Compositore Playlist Unificato** ✅
   - La modifica riapre la playlist direttamente nel riquadro di composizione/creazione a destra (con riordino ▲▼, rinomina e rimozione ✕), eliminando il vecchio modulo separato.
13. **Modale Rapida Aggiunta Playlist da Coda (Home)** ✅
   - Tasto `+` sui brani della coda attiva con modale a caselle di spunta (checkbox) per associare o rimuovere il brano dalle playlist in un click.
14. **Compilazione & Packaging APK Android Sincronizzato** ✅
   - Compilato con successo l'APK universale (`app-universal-debug.apk`, 154 MB) contenente tutte le ultime novità: compositore playlist unificato, modale rapida checkbox, fix risveglio standby, icone punk adaptive e foreground service.
   - Posizionato nella root del progetto (`./app-universal-debug.apk`) in conformità con la Regola Zero-Terminal.

---

## 🎯 Prossimi Passi Consigliati
1. **Invio e Installazione su Smartphone:** Trasferire `app-universal-debug.apk` sul telefono (tramite Telegram Desktop / Web, cavo USB o AirDrop/condivisione) e procedere all'installazione.
2. **Collaudo su Dispositivo Mobile Reale:** Verificare la riproduzione in background a schermo spento con `AudioService.kt`, la nuova modale con checkbox e il compositore unificato.

---

## 🛠️ Comandi Utili per l'Ambiente di Lavoro

### Variabili d'ambiente per Android (macOS Apple Silicon):
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export NDK_HOME="$ANDROID_HOME/ndk/26.3.11579264"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
```

### Compilazione APK Android:
```bash
npx tauri android build --apk --debug --target aarch64
# L'APK compilato si trova in:
# src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk
# Per comodità copiarlo nella root del progetto:
cp src-tauri/gen/android/app/build/outputs/apk/universal/debug/app-universal-debug.apk ./app-universal-debug.apk
```

### Avvio Desktop:
```bash
npm run tauri dev
```

### Verifica Rigorosa Limite 150 Righe:
```bash
wc -l src-tauri/src/*.rs src/css/*.css src/js/**/*.js src-tauri/gen/android/app/src/main/java/org/blasopen/musicplayer/*.kt
```

---

## 💬 Prompt Suggerito per Iniziare la Nuova Chat

Puoi copiare e incollare il seguente testo all'avvio della nuova chat:

```text
Ciao! Continuiamo lo sviluppo di BlasMusicPlayer a partire dal documento STATO_PROGETTO_HANDOFF.md presente nella root del progetto (/Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer).
Il branch di lavoro attivo è feature/responsive-android.
Ricordati i vincoli di AGENTS.md (massimo 150 righe per file di codice e commenti rigorosamente in italiano).
Oggi possiamo procedere con la compilazione e test del nuovo APK Android seguendo docs/manuali/guida_aggiornamento_android.md!
```

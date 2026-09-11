# 📋 Documento di Handoff & Stato del Progetto — BlasMusicPlayer

> **Data:** 11 Settembre 2026 (Sessione 2)
> **Repository:** https://github.com/maurobeltrami/BlasMusicPlayer.git
> **Branch Corrente:** `feature/responsive-android`
> **Ultimo Commit:** da committare — "feat(playlist-crud): CRUD completo playlist + icone app punk verde"
> **APK Android Pronto:** `./app-universal-debug.apk` (icone aggiornate, rebuild richiesto)

  

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
- `commands.rs` (143 righe): Scansione cartelle (`scan_directory`, `scan_folder_recursive`), navigazione cartelle comuni (`get_common_dirs`), selezione cartelle cross-platform (`pick_audio_folder`).
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
- `src/css/style.css` (40 righe): Box-sizing globale, prevenzione overflow orizzontale, utility `.pt-safe` e `.pb-safe`, stile per range verticali (`writing-mode: vertical-lr; direction: rtl; -webkit-appearance: slider-vertical; width: 28px;`).
- `src/js/app.js` (133 righe): Entry point principale, gestione eventi di inizializzazione, router, drag & drop e loop del visualizzatore a 60 FPS.
- `src/js/core/`:
  - `mediaLoader.js` (112 righe): Risoluzione URL streaming e copertina, aggiornamento `MediaMetadata` per la schermata di blocco, buffering resiliente con listener `canplay` e gestione `onload`/`onerror` anti-immagini rotte.
  - `audioEngine.js` (105 righe): DSP Web Audio API (filtri EQ 3 bande, compressore dinamico, gain master, analizzatore FFT).
  - `stateManager.js` (104 righe): Sincronizzazione stato tra LocalStorage e persistenza nativa JSON.
- `src/js/data/playlist.js` (77 righe): Gestione coda di riproduzione attiva, cronologia e algoritmo di shuffle casuale.
- `src/js/events/`:
  - `navigation.js` (145 righe): Navigazione del filesystem. Cliccando su un brano, l'intera cartella entra in coda e il playback parte da quel brano; con il tasto `+` si aggiunge una singola traccia.
  - `playlistsManager.js` (129 righe): Gestione caricamento ed eliminazione playlist salvate con blocco `isUpdatingSelector` anti-loop.
  - `playlistComposer.js` (107 righe): Bozza per la creazione di nuove playlist.
  - `playlistFolderBrowser.js` (133 righe): Browser cartelle dedicato per la composizione delle playlist.
  - `playback.js` (92 righe): Controlli play/pause, next, prev, volume, mute e associazione comandi fisici (`navigator.mediaSession`).
  - `audio.js` (69 righe): Gestione avanzamento continuo traccia (`onended`), barra di avanzamento e gestione errori (`MEDIA_ERR_ABORTED`).
  - `equalizer.js` (67 righe): Collegamento slider equalizzatore e compressore.

---

### 🚀 Funzionalità Risolte e Verificate
1. **Layout 100% Responsive e Fullscreen Lock** ✅
2. **Libreria Comprimibile ad Accordion** ✅
3. **Riproduzione Continua in Background & Standby (AudioService.kt)** ✅
4. **Correzione Avanzamento Coda** ✅
5. **Equalizzatore Verticale Perfetto** ✅
6. **Copertine Incorporate nei file MP3/FLAC** ✅
7. **CRUD Completo delle Playlist** ✅
   - Rinomina playlist con validazione conflitti nome (`stateManager.renamePlaylist`)
   - Rimozione singoli brani dal pannello editor in-page (`playlistEditor.js`)
   - Riordino brani con pulsanti ▲▼ (swap $O(1)$, compatibile touch Android)
   - Aggiunta brani a playlist esistente via navigatore (modalità append)
8. **Icone App Aggiornate** ✅
   - Logo punk stencil verde acido generato a 1024×1024
   - `npx tauri icon` ha generato tutte le densità desktop (`.icns`, `.ico`) e Android `mipmap`
   - Rebuild APK necessario per distribuire le nuove icone ad Android

---

## 🎯 Prossimi Passi Consigliati
1. **Test Manuale CRUD:** Test approfondito dell'editor playlist su desktop e mobile.
2. **Rebuild APK Android:** Compilazione del nuovo APK Android con le icone punk verdi integrate tramite `npx tauri android build`.

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
wc -l src-tauri/src/*.rs src/css/*.css src/css/**/*.css src/js/**/*.js src-tauri/gen/android/app/src/main/java/org/blasopen/musicplayer/*.kt
```

---

## 💬 Prompt Suggerito per Iniziare la Nuova Chat

Puoi copiare e incollare il seguente testo all'avvio della nuova chat:

```text
Ciao! Continuiamo lo sviluppo di BlasMusicPlayer a partire dal documento STATO_PROGETTO_HANDOFF.md presente nella root del progetto (/Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer).
Il branch di lavoro attivo è feature/responsive-android.
Ricordati i vincoli di AGENTS.md (massimo 150 righe per file di codice e commenti rigorosamente in italiano).
Oggi dobbiamo implementare:
1. La logica CRUD completa per le playlist (modifica nome, aggiunta/rimozione singoli brani da una playlist esistente, riordino).
2. La procedura per sostituire il logo e le icone dell'app sia per desktop che per mobile Android.
Iniziamo analizzando come strutturare il CRUD delle playlist!
```

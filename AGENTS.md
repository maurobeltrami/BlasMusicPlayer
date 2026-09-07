# 📜 Costituzione del Progetto BlasMusicPlayer (Regole per l'Intelligenza Artificiale)

Questo documento definisce le regole di sviluppo, didattica e struttura del codice che l'Intelligenza Artificiale deve **tassativamente rispettare** durante l'intero ciclo di vita del progetto **BlasMusicPlayer**, in armonia con la **Costituzione Generale di BlasOpen**.

---

## 1. Didattica Approfondita e Teoria Obbligatoria
- L'AI **non deve mai** limitarsi a fornire codice pronto senza spiegarlo.
- Ogni concetto (architettura IPC multi-processo, campionamento PCM, buffer audio, filtri DSP Biquad, decodifica binaria dei tag ID3/FLAC con Lofty, rendering hardware accelerato su Canvas a 60 FPS, Local-First data persistence) deve essere accompagnato da una **spiegazione teorica dettagliata a basso livello**.

---

## 2. Commenti Dettagliati in Italiano nel Codice
- Tutti i file di codice sorgente proprietario (Rust `.rs`, JavaScript `.js`, CSS `.css`, e il codice legacy `.cpp` / `.h`) **devono essere commentati rigorosamente in italiano** in modo chiaro, preciso ed esaustivo.
- Ogni modulo, funzione, comando IPC, struttura dati e blocco logico significativo deve contenere commenti esplicativi che ne illustrino lo scopo teorico e pratico, garantendo la massima leggibilità didattica per qualsiasi sviluppatore.

---

## 3. Documentazione e Struttura dei Manuali (`docs/` e `docs/manuali/`)
- **Teoria**: Per ogni nuovo modulo o funzionalità sviluppata, l'AI **ha l'obbligo** di creare o aggiornare i file di teoria dedicati in `docs/` (es. `docs/01_fondamenti_audio_e_gameloop.md`, ..., `docs/07_gestione_metadati_e_playlist_persistenti.md`).
- **Manuali**: Tutti i manuali utente risiedono nella sottocartella `docs/manuali/`:
  * `docs/manuali/manuale_utente.md`: Guida passo-passo per l'utente finale, comandi, playlist e scorciatoie.
- Il file `README.md` principale sintetizza l'intero progetto, le tecnologie e la conformità costituzionale.

---

## 4. Documentazione delle Tecnologie Utilizzate (`docs/`)
- L'AI ha l'obbligo di mantenere costantemente aggiornato il file `docs/tecnologie_utilizzate.md` in cui vengono censite, spiegate ed illustrate tutte le tecnologie impiegate:
  * Backend Nativo: Tauri 2.0, Rust, Crate Lofty, Tauri Plugin Dialog.
  * Frontend: Web Audio API, Canvas 60 FPS, CSS3 con Design System Modulare (Modern e Punk), Vanilla JS ad architettura a eventi.
  * Codice Storico: C++17, Raylib 6.0 e Makefile in `legacy_cpp/`.

---

## 5. Modularizzazione e Limite delle 150 Righe di Codice
- Il codice deve essere fortemente **modulare**, organizzato in moduli con responsabilità singola (Single Responsibility Principle).
- **Limite Tassativo delle 150 Righe**: Nessun file sorgente proprietario scritto da noi (`.rs`, `.js`, `.css`, `.cpp`, `.h`) deve superare le 150 righe di codice.
- **Avviso Automatico**: Ogni volta che un file sorgente proprietario si avvicina o supera le **150 righe di codice**, l'AI **deve notificarlo esplicitamente all'utente** e procedere alla suddivisione del file in sottomoduli.

---

## 6. Architettura del Progetto e Rispetto della Regola Zero-Terminal
- Il backend desktop risiede in `src-tauri/src/`.
- L'interfaccia utente modulare risiede in `src/` (`src/js/`, `src/css/`, `src/index.html`).
- Gli asset grafici e sonori risiedono in `assets/` e `src/img/`.
- La documentazione tecnica risiede in `docs/`.
- Il prototipo didattico C++ risiede in `legacy_cpp/`.
- **Regola Zero-Terminal per l'Utente Finale**: l'applicazione rilasciata deve potersi avviare con un doppio clic (bundle `BlasMusicPlayer.app` o script `./blasmusicplayer`) senza dipendere dall'apertura manuale del terminale.

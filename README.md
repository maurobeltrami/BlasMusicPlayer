# 🎵 BlasMusicPlayer

![Tauri 2.0](https://img.shields.io/badge/Tauri-2.0-blue.svg)
![Rust](https://img.shields.io/badge/Rust-2021-orange.svg)
![Web Audio](https://img.shields.io/badge/Web%20Audio-HTML5%20%2F%20CSS3-yellowgreen.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)
![Zero-Terminal](https://img.shields.io/badge/Zero--Terminal-100%25%20Compliant-brightgreen.svg)

**BlasMusicPlayer** è un riproduttore musicale desktop moderno, nativo, ultra-leggero e rigorosamente conforme ai principi **Local-First & Zero-Terminal** dell'ecosistema **[BlasOpen](../../COSTITUZIONE.md)**.

Combina la velocità e la sicurezza di un backend nativo in **Rust** (su architettura **Tauri 2.0**) con la fluidità e l'eleganza grafica della **Web Audio API** e del rendering hardware accelerato a 60 FPS, garantendo un consumo di RAM minimo (30-50 MB) e l'assenza totale di abbonamenti, pubblicità o telemetria.

---

## ✨ Caratteristiche Principali

* **Regola Zero-Terminal:** Nessun interprete esterno da installare o comando da digitare. Si avvia istantaneamente con un doppio clic su `BlasMusicPlayer.app` o tramite lo script `./blasmusicplayer`.
* **Navigazione Cartelle & Play Sottocartelle:** Esplora la tua musica locale liberamente. Ogni cartella o sottocartella include un pulsante Play rapido per ascoltarne direttamente l'intero contenuto.
* **Sistema Playlist Persistente:** Crea, personalizza e conserva le tue playlist in locale. Pagina dedicata con navigazione a cartelle e pulsante `+` per comporre playlist traccia per traccia.
* **Memoria di Stato Automatica:** L'applicazione ricorda sempre l'ultima cartella esplorata, riaprendola immediatamente all'avvio.
* **Metadati e Copertine Native:** Analisi binaria ad alte prestazioni con la crate Rust `lofty`: visualizzazione in tempo reale di Artista, Titolo e Cover Art originale embedded.
* **Visualizzatore Audio a 60 FPS:** Analizzatore di spettro (Barre), Forma d'onda (Oscilloscopio), Anelli d'onda reattivi e Vinile rotante animato.
* **Equalizzatore Master a 3 Bande:** Bassi, Medi, Alti e processamento dinamico senza latenza.
* **Doppio Tema Grafico:** Look *Modern Dark* (stile Spotify) e look *Punk Acid* con lo sfondo leopardato originale (`.leopard-bg`) e accenti al neon.

---

## 🚀 Avvio Rapido

### 1. Per l'Utente Finale (Zero-Terminal)
Fai doppio clic sull'applicazione:
* **`BlasMusicPlayer.app`** (oppure `./blasmusicplayer` da Finder).

### 2. Per gli Sviluppatori (Compilazione da sorgente)
```bash
# Installa le dipendenze
npm install

# Avvia l'applicazione in modalità sviluppo
npm run tauri dev

# Compila i binari nativi e il pacchetto .dmg / .app
npm run tauri build
```

---

## 🏛️ Costituzione e Didattica BlasOpen

BlasMusicPlayer rispetta i principi di etica, privacy, modularità (limite tassativo di 150 righe per file di codice sorgente) e trasparenza didattica stabiliti nella:
* 📜 **[Costituzione dell'Ecosistema BlasOpen](../../COSTITUZIONE.md)**
* 📜 **[Regole del Progetto (AGENTS.md)](AGENTS.md)**
* 📚 **[Documentazione e Manuali Didattici](docs/)**
  * [01. Fondamenti Audio e Game Loop](docs/01_fondamenti_audio_e_gameloop.md)
  * [02. Gestione Tempo e Seek Bar](docs/02_gestione_tempo_e_seekbar.md)
  * [03. Architettura Playlist e Code](docs/03_architettura_playlist_e_code.md)
  * [04. Navigazione Filesystem e File Browser](docs/04_navigazione_filesystem_e_filebrowser.md)
  * [05. Modernizzazione UI e Temi Grafici](docs/05_modernizzazione_ui_e_temi_grafici.md)
  * [06. Architettura Moderna: Tauri 2.0 e IPC](docs/06_architettura_tauri_e_ipc.md)
  * [07. Gestione Metadati, Copertine e Playlist](docs/07_gestione_metadati_e_playlist_persistenti.md)
  * [Manuale Utente Ufficiale](docs/manuali/manuale_utente.md)
  * [Censimento Tecnologie Utilizzate](docs/tecnologie_utilizzate.md)

*(Nota didattica: il prototipo iniziale sviluppato in C++17 e Raylib 6.0 è interamente conservato e consultabile all'interno della cartella `legacy_cpp/`).*

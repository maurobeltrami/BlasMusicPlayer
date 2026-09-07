# 🛠️ Tecnologie Utilizzate in BlasMusicPlayer

Questo documento censisce, illustra e spiega tutte le librerie, i framework ed i linguaggi utilizzati nel progetto **BlasMusicPlayer**, nel rispetto della Costituzione didattica del progetto.

---

## 1. Linguaggio: C++17 (ISO/IEC 14882:2017)
* **Perché C++17?** Offre il massimo delle prestazioni, controllo deterministico della memoria tramite RAII (Resource Acquisition Is Initialization), costrutti moderni come `std::string_view`, `std::filesystem` per la scansione delle cartelle musicali e zero garbage collection che causerebbe interruzioni audio.

---

## 2. Framework Multimediale: Raylib 6.0
* **Sito Ufficiale:** [https://www.raylib.com/](https://www.raylib.com/)
* **Scopo:** Gestione del contesto grafico OpenGL (Metal su macOS), creazione della finestra desktop, intercettazione input (tastiera, mouse, drag & drop) e disegno vettoriale dell'interfaccia utente a 60 FPS.

---

## 3. Motore Audio Interno: miniaudio (integrato in Raylib)
* **Scopo:** Decodifica in streaming a bassa latenza dei principali formati audio compressi e non compressi:
  * **MP3** (MPEG-1 Audio Layer III)
  * **WAV** (Waveform Audio File Format)
  * **FLAC** (Free Lossless Audio Codec)
  * **OGG Vorbis**
* **Elaborazione DSP:** Consente l'aggancio di funzioni callback per intercettare i campioni PCM in tempo reale prima che raggiungano la scheda audio, permettendo equalizzazione e visualizzazione spettrale.

---

## 4. Build System: Makefile (Clang / Clang++)
* **Compilatore:** `clang++` con flag `-std=c++17 -Wall -Wextra`.
* **Framework di Sistema macOS:**
  * `Cocoa` (finestra e gestione eventi nativi)
  * `OpenGL` (rendering hardware)
  * `IOKit` e `CoreVideo` (sincronizzazione verticale V-Sync e temporizzazione)

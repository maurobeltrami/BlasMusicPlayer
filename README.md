# 🎵 BlasMusicPlayer

![C++17](https://img.shields.io/badge/C%2B%2B-17-blue.svg)
![Raylib](https://img.shields.io/badge/Raylib-6.0-red.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey.svg)

**BlasMusicPlayer** è un riproduttore musicale desktop moderno, nativo, ultra-leggero e conforme alla filosofia **Local-First & Zero-Terminal** dell'ecosistema **BlasOpen**.

Scritto in **C++17** con il supporto grafico e multimediale di **Raylib 6.0**, è concepito per consentire all'utente di ascoltare la propria musica senza server da avviare, senza abbonamenti e con avvio istantaneo a doppio click.

---

## ✨ Caratteristiche Principali

* **Regola Zero-Terminal:** Singolo file eseguibile nativo, nessun interprete Python o server web richiesto.
* **Drag & Drop Diretto:** Trascina qualsiasi file musicale (`.mp3`, `.wav`, `.flac`, `.ogg`) o intere cartelle direttamente nella finestra dell'app.
* **Stile Dark Spotify:** Interfaccia grafica elegante, scura e riposante, con accenti Verde Spotify (`#1DB954`).
* **Visualizzatore Audio Realtime:** Analizzatore di spettro (Barre), Forma d'onda (Waveform) e Cerchi concentrici.
* **Equalizzatore Master a 3 Bande:** Bassi, Medi, Alti e Bass Boost integrato.

---

## 🛠️ Compilazione e Avvio Rapido

```bash
# Compila il progetto
make clean && make

# Avvia il riproduttore
./blasmusicplayer
```

---

## 📜 Costituzione e Didattica

Il progetto segue rigorosamente le regole didattiche e architetturali stabilite in:
👉 **[AGENTS.md](AGENTS.md)**

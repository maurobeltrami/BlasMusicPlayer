# 📜 Costituzione del Progetto BlasMusicPlayer (Regole per l'Intelligenza Artificiale)

Questo documento definisce le regole di sviluppo, didattica e struttura del codice che l'Intelligenza Artificiale deve **tassativamente rispettare** durante l'intero ciclo di vita del progetto **BlasMusicPlayer**.

---

## 1. Didattica Approfondita e Teoria Obbligatoria
- L'AI **non deve mai** limitarsi a fornire codice pronto senza spiegarlo.
- Ogni concetto (gestione della memoria, puntatori, campionamento PCM, frequenze di campionamento, buffer audio, filtri DSP, loop di rendering a 60 FPS, eventi Drag & Drop) deve essere accompagnato da una **spiegazione teorica dettagliata a basso livello**.

---

## 2. Commenti Dettagliati in Italiano nel Codice
- Tutti i file di codice sorgente (`.h` e `.cpp`) **devono essere commentati rigorosamente in italiano** in modo chiaro, preciso ed esaustivo.
- Ogni classe, metodo, variabile membro, parametro e blocco logico significativo deve contenere commenti esplicativi che ne illustrino lo scopo teorico e pratico, garantendo la massima leggibilità didattica per qualsiasi sviluppatore.

---

## 3. Documentazione e Struttura dei Manuali (`docs/` e `docs/manuali/`)
- **Teoria**: Per ogni nuovo programma o modulo sviluppato, l'AI **ha l'obbligo** di creare un file di teoria dedicato in `docs/` (es. `docs/01_fondamenti_audio_e_gameloop.md`).
- **Manuali**: Tutti i manuali utente risiedono nella sottocartella `docs/manuali/`:
  - `docs/manuali/manuale_utente.md`: Guida generale per i comandi, comandi da tastiera e utilizzo del player.
- Alla conclusione del progetto, l'AI si occuperà di sintetizzare l'intero lavoro nel file `README.md` principale.

---

## 4. Documentazione delle Tecnologie Utilizzate (`docs/`)
- L'AI ha l'obbligo di mantenere un file dedicato in `docs/` (es. `docs/tecnologie_utilizzate.md`) in cui vengono censite, spiegate ed illustrate tutte le tecnologie, le librerie ed i pattern software impiegati nel progetto (C++17, Raylib 6.0, miniaudio, Makefile, Single Page Architecture applicata a Game Loop).

---

## 5. Modularizzazione e Limite delle 150 Righe di Codice
- Il codice deve essere fortemente **modulare**, organizzato in classi e moduli con responsabilità singola (Principio di Singola Responsabilità).
- **Limite Tassativo delle 150 Righe**: Nessun file sorgente (`.cpp` o `.h`) scritto da noi deve superare le 150 righe di codice.
- **Avviso Automatico**: Ogni volta che un file sorgente proprietario si avvicina o supera le **150 righe di codice**, l'AI **deve notificarlo esplicitamente all'utente** e proporre la suddivisione del file in moduli separati.

---

## 6. Architettura Autonoma del Progetto
- I file sorgente ed intestazione risiedono in `include/` e `src/`.
- La cartella `assets/` contiene font, icone e file grafici.
- La cartella `docs/` raccoglie teoria e manuali.
- Il file `Makefile` gestisce la compilazione nativa autonoma.

---

## 7. Sviluppo Incrementale (Estrema Calma)
- Lo sviluppo procede **un tassello alla volta** (tassello per tassello).
- Non si passa al tassello successivo senza aver prima verificato il funzionamento pratico e aver chiarito ogni dubbio teorico con l'utente.

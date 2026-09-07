# 📚 Lezione 03: Strutture Dati per Playlist, Scansione Ricorsiva e Auto-Play

In questa terza lezione teorica affrontiamo l'architettura che permette a un riproduttore musicale di gestire non più una singola traccia isolata, ma una **coda di riproduzione dinamica (Playlist)**.

---

## 1. Struttura Dati: Perché `std::vector` per la Playlist?

Nella memoria di un computer, una playlist musicale deve consentire:
1. Accesso istantaneo a qualsiasi brano dato il suo numero d'ordine (es. traccia #5).
2. Aggiunta rapida in coda quando l'utente trascina nuovi file.
3. Scorrimento continuo avanti (`Next`) e indietro (`Previous`).

In C++17, la struttura dati ottimale per questo compito è il vettore dinamico contiguo **`std::vector`**:
```cpp
struct TrackInfo {
    std::string filePath; // Percorso assoluto su disco
    std::string title;    // Titolo formattato visualizzato a video
};

std::vector<TrackInfo> tracks;
int currentIndex = -1; // Indice del brano correntemente in riproduzione
```

### Complessità Computazionale:
* **Accesso al brano corrente (`tracks[currentIndex]`):** Operazione a tempo costante $O(1)$, ovvero accesso immediato tramite puntatore alla memoria contigua.
* **Aggiunta in coda (`push_back`):** Ammortizzata $O(1)$.

---

## 2. Scansione Ricorsiva del File System (`std::filesystem`)

Quando l'utente trascina una cartella (es. una cartella "Rock" che contiene sottocartelle "Queen", "Pink Floyd", ecc.), il programma non può limitarsi a guardare la superficie: deve esplorare l'intero albero gerarchico delle directory.

La libreria standard di C++17 offre `std::filesystem::recursive_directory_iterator`:
```cpp
namespace fs = std::filesystem;

for (const auto& entry : fs::recursive_directory_iterator(folderPath)) {
    if (entry.is_regular_file()) {
        std::string ext = entry.path().extension().string();
        for (auto& c : ext) c = tolower(c);
        if (ext == ".mp3" || ext == ".wav" || ext == ".flac" || ext == ".ogg") {
            // Trovato brano compatibile: aggiunta alla playlist
            AddTrack(entry.path().string());
        }
    }
}
```
Questo garantisce che l'utente possa trascinare un intero hard disk esterno o la cartella `Musica` del Mac e veder comparire tutti i brani in un istante.

---

## 3. La Macchina a Stati dell'Auto-Play (Fine Traccia $\rightarrow$ Brano Successivo)

Come fa il riproduttore a capire che una canzone è terminata per passare alla successiva senza fermare la musica?

Ad ogni fotogramma del Game Loop (60 FPS):
1. Verifichiamo la condizione di **Fine Traccia (End of Stream)**:
   $$\text{tempo\_trascorso} \ge \text{durata\_totale} - 0.1\text{s}$$
2. Se la condizione è vera e la traccia non è in pausa:
   * Chiamiamo `playlist.Next()`
   * Se c'è un brano successivo, carichiamo `playlist.GetCurrentTrack()->filePath` e avviamo la riproduzione.
   * Se siamo all'ultimo brano della lista, riavvolgiamo all'inizio se il `loop` è attivo, oppure ci arrestiamo elegantemente.

---

## 4. Rendering di Liste Grafiche con Offset di Scorrimento (Scroll)

Quando una playlist contiene 50 brani, non possono essere disegnati tutti contemporaneamente nello spazio verticale dello schermo ($640\text{px}$).

Si introduce una variabile di **offset di scorrimento** `scrollY`:
* Quando l'utente gira la rotellina del mouse (`GetMouseWheelMove()`), modifichiamo `scrollY`.
* Durante la fase di disegno, ogni elemento $i$ viene posizionato a:
  $$Y_i = Y_{\text{base}} + (i \times \text{altezza\_riga}) + \text{scrollY}$$
* Con la tecnica del *Clipping/Scissor Mode* (`BeginScissorMode` e `EndScissorMode` di Raylib), gli elementi che scorrono oltre l'area visibile vengono automaticamente nascosti dalla GPU, garantendo un'interfaccia pulita e priva di artefatti grafici.

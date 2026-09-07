# 📚 Lezione 02: Gestione del Tempo, Interpolazione Lineare e Seek Bar

In questa seconda lezione didattica approfondiamo come un lettore multimediale converte i campioni audio in coordinate grafiche bidimensionali e come gestire l'interazione del mouse per saltare avanti e indietro nel brano (*Seeking* e *Scrubbing*).

---

## 1. La Conversione del Tempo: Dai Secondi al Formato `MM:SS`

Un motore audio restituisce il tempo trascorso e la durata totale in numeri a virgola mobile (`float`), che rappresentano i secondi (es. $194.75\text{ secondi}$).

Per presentarli all'utente nella classica notazione musicale minuti:secondi (`03:14`), applichiamo due semplici operazioni matematiche:

1. **Minuti interi:** 
   $$\text{minuti} = \lfloor \text{secondi} / 60 \rfloor$$
2. **Secondi rimanenti (Operatore Modulo):**
   $$\text{secondi\_residui} = \lfloor \text{secondi} \rfloor \pmod{60}$$

In C++:
```cpp
int totalSec = (int)seconds;
int m = totalSec / 60;
int s = totalSec % 60;
// Esempio con printf: snprintf(buf, sizeof(buf), "%02d:%02d", m, s);
```
Il formato `%02d` assicura che un valore come $5$ secondi venga visualizzato con lo zero iniziale (`"05"`), evitando salti grafici nella larghezza del testo.

---

## 2. La Mappatura Matematica: Tempo $\leftrightarrow$ Pixel dello Schermo

La Seek Bar è una barra orizzontale definita da:
* Posizione $X$ iniziale: $\text{barX}$
* Larghezza in pixel: $\text{barW}$

### A. Da Tempo a Coordinata Grafica (Fase di Disegno)
Per sapere a quale pixel dello schermo posizionare la testina di riproduzione:
1. Calcoliamo la percentuale normalizzata $t \in [0.0, 1.0]$:
   $$t = \frac{\text{tempo\_trascorso}}{\text{durata\_totale}}$$
2. Moltiplichiamo per la larghezza della barra e aggiungiamo l'offset iniziale:
   $$\text{pixelX} = \text{barX} + (t \times \text{barW})$$

### B. Dal Click del Mouse al Tempo Audio (Fase di Input)
Quando l'utente clicca con il mouse sul pixel $X_{\text{mouse}}$:
1. Calcoliamo la posizione relativa alla barra e la vincoliamo (*clamp*) tra $0.0$ e $1.0$ per evitare che click esterni vadano fuori scala:
   $$t = \text{std::clamp}\left(\frac{X_{\text{mouse}} - \text{barX}}{\text{barW}}, 0.0f, 1.0f\right)$$
2. Moltiplichiamo la percentuale ottenuta per la durata totale per ricavare i secondi esatti:
   $$\text{secondi\_bersaglio} = t \times \text{durata\_totale}$$
3. Chiamiamo `audioEngine.Seek(secondi_bersaglio)`.

---

## 3. Gestione dello "Scrubbing" (Trascinamento Continuo)

C'è una differenza fondamentale tra un semplice click e il **trascinamento (Scrubbing)**:
* Se l'utente clicca e tiene premuto il tasto sinistro del mouse, la testina deve seguire il cursore istantaneamente sullo schermo.
* Durante il trascinamento attivo (`isScrubbing = true`), l'interfaccia non deve essere riscritta dal tempo proveniente dalla scheda audio, bensì deve seguire il dito/mouse dell'utente.
* Nel momento in cui l'utente rilascia il pulsante del mouse (`IsMouseButtonReleased(MOUSE_BUTTON_LEFT)`), inviamo il comando di riposizionamento al decoder.

Nel prossimo modulo realizziamo questa logica in un componente C++ dedicato!

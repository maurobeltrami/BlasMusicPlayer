# 📚 Lezione 04: Navigazione nel File System, Tree Traversal e Dialog Native

In questa lezione approfondiamo come un software C++ nativo interagisce con il disco del computer per consentire all'utente di esplorare cartelle, navigare nell'albero delle directory e invocare finestre di dialogo native del sistema operativo.

---

## 1. La Gestione delle Directory in C++17 (`std::filesystem`)

Prima di C++17, aprire una cartella su Mac, Windows o Linux richiedeva codice completamente diverso (API POSIX `opendir` su Unix/Mac e `FindFirstFile` su Windows).

Con C++17, il comitato ISO ha standardizzato **`std::filesystem`**:

### Le operazioni essenziali:
1. **Ottenere il percorso corrente o la cartella Home:**
   ```cpp
   namespace fs = std::filesystem;
   fs::path current = fs::current_path();
   ```
2. **Risalire la gerarchia (`parent_path()`):**
   ```cpp
   fs::path parent = current.parent_path();
   ```
3. **Iterare il contenuto di una cartella con gestione errori:**
   Per evitare che il programma vada in crash se l'utente tenta di aprire una cartella protetta (es. senza permessi di lettura), si passa un oggetto `std::error_code`:
   ```cpp
   std::error_code ec;
   for (const auto& entry : fs::directory_iterator(path, ec)) {
       if (ec) break; // Gestione silenziosa degli errori di autorizzazione
       if (entry.is_directory()) { /* Cartella */ }
       else if (entry.is_regular_file()) { /* File */ }
   }
   ```

---

## 2. L'Ordinamento Tipico dei File Manager (Directory First)

Un'interfaccia intuitiva (stile Windows Explorer o macOS Finder) rispetta una regola visiva universale:
* **Le cartelle vengono mostrate per prime**, precedute dalla speciale cartella `.. (Livello superiore)`.
* **I file audio seguono le cartelle**.
* Entrambi i gruppi vengono ordinati alfabeticamente ignorando maiuscole e minuscole (*case-insensitive*):

```cpp
std::sort(items.begin(), items.end(), [](const FileItem& a, const FileItem& b) {
    if (a.isDirectory != b.isDirectory) return a.isDirectory > b.isDirectory;
    return a.name < b.name;
});
```

---

## 3. Invocare Finestre di Selezione Native del Sistema Operativo

Mentre il file browser integrato permette di esplorare direttamente all'interno dell'applicazione a 60 FPS, spesso gli utenti amano usare la classica finestra di dialogo del sistema operativo (con i preferiti laterali del Finder o di Esplora Risorse).

Su macOS, invece di importare librerie pesanti da decine di megabyte, possiamo richiamare il motore nativo di automazione Apple (**AppleScript** tramite `osascript`):
```cpp
// Richiesta nativa di selezione cartella a macOS:
FILE* fp = popen("osascript -e 'POSIX path of (choose folder)' 2>/dev/null", "r");
```
Il sistema operativo apre la sua autentica interfaccia utente di sistema, attende che l'utente scelga la cartella e restituisce la stringa del percorso al nostro programma con zero overhead!

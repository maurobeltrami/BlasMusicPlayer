# 07. Gestione Metadati, Copertine e Playlist Persistenti

Questo documento approfondisce l'architettura tecnica e teorica per l'estrazione a basso livello dei metadati audio (tag ID3, commenti Vorbis, copertine embedded) e il sistema di persistenza delle playlist in **BlasMusicPlayer**.

---

## 1. Teoria a Basso Livello: I Metadati Audio nei File Binari

Quando un file audio viene memorizzato su disco, non contiene soltanto campioni PCM compressi o grezzi, ma anche blocchi binari di intestazione dedicati ai metadati:

1. **Tag ID3v2 nei file MP3:**
   * Strutturati in *Frame* binari identificati da sequenze di 4 caratteri ASCII (es. `TIT2` per il titolo, `TPE1` per l'artista principale, `TALB` per l'album).
   * Il frame `APIC` (*Attached Picture*) contiene l'immagine della copertina serializzata in byte grezzi (JPEG o PNG) preceduta dal tipo MIME e dal tipo di immagine (es. 0x03 per copertina frontale).
2. **Commenti Vorbis nei file FLAC e OGG:**
   * Nei file FLAC, i metadati risiedono nei blocchi di metadati prima dello stream audio.
   * Il blocco `METADATA_BLOCK_PICTURE` memorizza larghezza, altezza, profondità di colore e i byte dell'immagine binaria.

---

## 2. Estrazione Nativa con Rust e la Crate `lofty`

Per evitare di sovraccaricare il frontend JavaScript con pesanti parser WebAssembly o librerie non ottimizzate, l'analisi binaria viene delegata al backend nativo **Rust** tramite la crate `lofty`:

```rust
// src-tauri/src/metadata.rs
let probe = Probe::open(path)?;
let tagged_file = probe.read()?;

// Estrazione del primo tag disponibile
if let Some(tag) = tagged_file.first_tag() {
    let title = tag.title().as_deref().map(|s| s.to_string());
    let artist = tag.artist().as_deref().map(|s| s.to_string());
    
    // Ricerca dell'immagine di copertina
    let cover_art = tag.pictures().first().map(|pic| {
        format!("data:{};base64,{}", mime_type, BASE64_STANDARD.encode(pic.data()))
    });
}
```

### Perché convertire la copertina in Base64 Data URI?
* **Zero scritture su disco temporanee:** Non è necessario creare file temporanei sul disco dell'utente.
* **Sicurezza totale (Sandboxing):** Il browser visualizza l'immagine come un URL `data:image/...;base64,...` valido e confinato in memoria RAM, garantendo compatibilità universale su WebKit.

---

## 3. Architettura delle Playlist e Local-First Persistence

Per rispettare l'Articolo 1 della **Costituzione di BlasOpen** (*Local-First & Sovranità dei Dati*), tutte le impostazioni e le playlist sono conservate sul dispositivo dell'utente senza richiedere account o connessioni esterne.

### Modello Dati e `localStorage`
Il gestore delle playlist ([`src/js/events/playlistsManager.js`](file:///Users/mauroi/Documents/blasopen/projects/BlasMusicPlayer/src/js/events/playlistsManager.js)) serializza lo stato in formato JSON:

```json
{
  "Preferiti": [
    { "path": "/Users/.../brano1.mp3", "name": "brano1.mp3" },
    { "path": "/Users/.../brano2.flac", "name": "brano2.flac" }
  ],
  "Rock Classics": [ ... ]
}
```

* **Salvataggio dell'Ultima Cartella Visitata:** La chiave `blas_last_folder` memorizza il percorso dell'ultima directory esplorata. Al riavvio dell'applicazione, il file browser apre direttamente quella cartella, garantendo continuità d'uso immediata.

---

## 4. Composizione Visuale e Riproduzione Rapida di Sottocartelle

1. **Compositore Playlist (`#playlistPage`):**
   * L'utente naviga l'albero delle directory nel pannello dedicato.
   * Ogni brano presenta un pulsante `+` per aggiungerlo istantaneamente alla playlist in fase di creazione.
2. **Play Rapido Sottocartelle:**
   * Accanto a ogni cartella nella visualizzazione principale è presente un'icona Play.
   * Facendo click su di essa, il backend Rust raccoglie ricorsivamente tutti i brani supportati e avvia subito la riproduzione dell'intero album o cartella.

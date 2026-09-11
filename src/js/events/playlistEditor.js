// events/playlistEditor.js - Pannello di modifica di una playlist salvata esistente
import * as stateManager from '../core/stateManager.js';

// Tracce attualmente in editing (copia locale, non modifica lo stato globale finché non si salva)
let editingTracks = [];
// Nome originale della playlist in modifica (per upsert corretto)
let editingName = '';
// Callback da invocare dopo ogni salvataggio riuscito
let onSavedCallback = null;

// Apre il pannello editor caricando i brani della playlist indicata
export function openEditor(playlist, savedCallback) {
    editingTracks = [...playlist.tracks];
    editingName = playlist.name;
    onSavedCallback = savedCallback;

    const panel = document.getElementById('playlist-editor-panel');
    const nameInput = document.getElementById('editorPlaylistName');
    if (!panel) return;

    if (nameInput) nameInput.value = editingName;
    panel.classList.remove('hidden');
    renderEditorList();
}

// Nasconde il pannello editor e resetta lo stato locale
export function closeEditor() {
    editingTracks = [];
    editingName = '';
    const panel = document.getElementById('playlist-editor-panel');
    if (panel) panel.classList.add('hidden');
}

// Restituisce i brani correntemente in editing (usato da playlistComposer per l'append)
export function getEditingTracks() { return editingTracks; }
export function getEditingName()  { return editingName;   }

// Aggiunge brani all'editor (chiamata da playlistComposer in modalità append)
export function appendTracks(tracks) {
    tracks.forEach(t => {
        // Evita duplicati assoluti (stesso percorso)
        if (!editingTracks.find(e => e.path === t.path)) {
            editingTracks.push({ ...t });
        }
    });
    renderEditorList();
}

// Renderizza la lista brani nell'editor con pulsanti ▲ ▼ e 🗑️
function renderEditorList() {
    const list = document.getElementById('editorTracksList');
    const counter = document.getElementById('editorTracksCount');
    if (!list) return;
    if (counter) counter.textContent = editingTracks.length;

    list.innerHTML = '';
    if (editingTracks.length === 0) {
        list.innerHTML = '<li class="p-3 text-center text-theme-muted italic text-[11px] border border-dashed border-box-border rounded">Nessun brano. Usa "+ Aggiungi" per inserire tracce.</li>';
        return;
    }

    editingTracks.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-1.5 p-1.5 bg-box-bg border border-box-border rounded text-xs hover:border-theme-accent';
        const artist = (t.artist && t.artist !== 'Locale') ? `<span class="opacity-60 text-[10px] ml-1">(${t.artist})</span>` : '';
        li.innerHTML = `
            <span class="text-[10px] opacity-50 w-5 text-right font-mono shrink-0">${idx + 1}.</span>
            <span class="truncate flex-1 font-semibold text-theme-text" title="${t.title}">${t.title}</span>${artist}
            <div class="flex gap-0.5 shrink-0">
                <button class="ed-up-btn px-1.5 py-1 bg-box-bg border border-box-border rounded hover:bg-theme-accent hover:text-white transition-colors text-[10px]" title="Sposta su" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="ed-dn-btn px-1.5 py-1 bg-box-bg border border-box-border rounded hover:bg-theme-accent hover:text-white transition-colors text-[10px]" title="Sposta giù" ${idx === editingTracks.length - 1 ? 'disabled' : ''}>▼</button>
                <button class="ed-rm-btn px-1.5 py-1 text-red-500 hover:text-red-700 rounded transition-colors text-[10px]" title="Rimuovi brano">✕</button>
            </div>
        `;
        // Listener riordino e rimozione
        li.querySelector('.ed-up-btn').onclick = () => { moveTrack(idx, -1); };
        li.querySelector('.ed-dn-btn').onclick = () => { moveTrack(idx, +1); };
        li.querySelector('.ed-rm-btn').onclick = () => { editingTracks.splice(idx, 1); renderEditorList(); };
        list.appendChild(li);
    });
}

// Sposta un brano verso l'alto (delta=-1) o il basso (delta=+1)
function moveTrack(idx, delta) {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= editingTracks.length) return;
    [editingTracks[idx], editingTracks[newIdx]] = [editingTracks[newIdx], editingTracks[idx]];
    renderEditorList();
}

// Registra i listener del pannello editor (chiamata una volta sola da playlistsManager)
export function setupPlaylistEditor() {
    const saveBtn  = document.getElementById('editorSaveBtn');
    const closeBtn = document.getElementById('editorCloseBtn');
    const nameInput = document.getElementById('editorPlaylistName');

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const newName = nameInput?.value?.trim();
            if (!newName) { alert('Inserisci un nome per la playlist!'); return; }
            // Rinomina se necessario
            if (newName !== editingName) {
                const res = await stateManager.renamePlaylist(editingName, newName);
                if (!res.ok) { alert(`Errore rinomina: ${res.error}`); return; }
                editingName = newName;
            }
            // Salva i brani aggiornati (savePlaylist è upsert per nome)
            await stateManager.savePlaylist(editingName, editingTracks);
            if (onSavedCallback) onSavedCallback();
            closeEditor();
        };
    }
    if (closeBtn) closeBtn.onclick = () => closeEditor();
}

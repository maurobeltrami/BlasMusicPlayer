// events/playlistComposer.js - Gestione creazione e modifica delle playlist
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';

let draftTracks = [];
let editingOriginalName = null;
let onSavedCallback = null;

export const getDraftTracks = () => draftTracks;
export const isEditing = () => !!editingOriginalName;

export function addTrack(track) {
    const t = { ...track, artist: (track.artist && track.artist !== 'Locale') ? track.artist : '' };
    draftTracks.push(t);
    renderDraftUI();
}

export function addTracks(tracks) {
    tracks.forEach(tr => {
        draftTracks.push({ ...tr, artist: (tr.artist && tr.artist !== 'Locale') ? tr.artist : '' });
    });
    renderDraftUI();
}

export function removeTrack(index) {
    draftTracks.splice(index, 1);
    renderDraftUI();
}

export function moveTrack(idx, delta) {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= draftTracks.length) return;
    [draftTracks[idx], draftTracks[newIdx]] = [draftTracks[newIdx], draftTracks[idx]];
    renderDraftUI();
}

export function clearDraft() {
    draftTracks = [];
    renderDraftUI();
}

export function cancelEditing() {
    editingOriginalName = null;
    clearDraft();
    updateComposerHeader(false);
    const input = document.getElementById('playlistNameInput');
    if (input) input.value = '';
}

export function loadPlaylistForEditing(playlist) {
    editingOriginalName = playlist.name;
    draftTracks = playlist.tracks.map(t => ({ ...t }));
    updateComposerHeader(true, playlist.name);
    const input = document.getElementById('playlistNameInput');
    if (input) { input.value = playlist.name; input.focus(); }
    renderDraftUI();
    document.getElementById('playlistNameInput')?.scrollIntoView({ behavior: 'smooth' });
}

function updateComposerHeader(isEdit, name = '') {
    const title = document.getElementById('composerModeTitle');
    const icon = document.getElementById('composerIcon');
    const btnText = document.getElementById('saveDraftBtnText');
    const cancelBtn = document.getElementById('cancelEditPlaylistBtn');

    if (title) title.textContent = isEdit ? `Modifica: ${name}` : 'Bozza Nuova Playlist';
    if (icon) icon.className = isEdit ? 'fas fa-pencil-alt text-acid-green shrink-0' : 'fas fa-magic text-acid-pink shrink-0';
    if (btnText) btnText.textContent = isEdit ? 'Salva Modifiche' : 'Salva';
    if (cancelBtn) cancelBtn.classList.toggle('hidden', !isEdit);
}

export function renderDraftUI() {
    const countEl = document.getElementById('draftTracksCount');
    const listEl = document.getElementById('draftTracksList');
    if (countEl) countEl.textContent = draftTracks.length;
    if (!listEl) return;

    listEl.innerHTML = '';
    if (draftTracks.length === 0) {
        listEl.innerHTML = '<li class="p-3 text-center text-theme-muted italic border border-dashed border-box-border rounded text-[11px]">Usa il tasto <strong class="text-acid-pink font-bold">+</strong> sui brani a sinistra per aggiungere tracce!</li>';
        return;
    }

    draftTracks.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between gap-1.5 p-1.5 bg-box-bg border border-box-border rounded hover:border-theme-accent text-xs';
        const artist = (t.artist && t.artist !== 'Locale') ? `<span class="opacity-60 text-[10px] ml-1">(${t.artist})</span>` : '';
        li.innerHTML = `
            <span class="text-[10px] opacity-50 w-4 text-right font-mono shrink-0">${idx + 1}.</span>
            <span class="truncate flex-1 font-semibold text-theme-text" title="${t.title}">${t.title}</span>${artist}
            <div class="flex items-center gap-0.5 shrink-0">
                <button class="up-btn px-1 py-0.5 hover:text-acid-green text-[10px]" title="Sposta su" ${idx === 0 ? 'disabled' : ''}>▲</button>
                <button class="dn-btn px-1 py-0.5 hover:text-acid-green text-[10px]" title="Sposta giù" ${idx === draftTracks.length - 1 ? 'disabled' : ''}>▼</button>
                <button class="rm-btn px-1 py-0.5 text-red-500 hover:text-red-700 text-[10px]" title="Rimuovi">✕</button>
            </div>
        `;
        li.querySelector('.up-btn').onclick = () => moveTrack(idx, -1);
        li.querySelector('.dn-btn').onclick = () => moveTrack(idx, 1);
        li.querySelector('.rm-btn').onclick = () => removeTrack(idx);
        listEl.appendChild(li);
    });
}

export function setupPlaylistComposer(savedCallback) {
    onSavedCallback = savedCallback;
    const nameInput = document.getElementById('playlistNameInput');
    const saveBtn = document.getElementById('saveDraftPlaylistBtn');
    const clearBtn = document.getElementById('clearDraftBtn');
    const cancelBtn = document.getElementById('cancelEditPlaylistBtn');
    const importBtn = document.getElementById('saveCurrentQueueAsPlaylistBtn');

    if (saveBtn) {
        saveBtn.onclick = async () => {
            const name = nameInput?.value?.trim();
            if (!name) { alert('Inserisci un nome per la playlist!'); nameInput?.focus(); return; }
            if (draftTracks.length === 0) { alert('Aggiungi almeno un brano prima di salvare!'); return; }

            if (editingOriginalName) {
                if (name !== editingOriginalName) {
                    const res = await stateManager.renamePlaylist(editingOriginalName, name);
                    if (!res.ok) { alert(`Errore rinomina: ${res.error}`); return; }
                }
                await stateManager.savePlaylist(name, draftTracks);
                alert(`Playlist "${name}" aggiornata con successo!`);
            } else {
                await stateManager.savePlaylist(name, draftTracks);
                alert(`Playlist "${name}" creata con successo!`);
            }
            cancelEditing();
            if (onSavedCallback) onSavedCallback();
        };
    }

    if (clearBtn) clearBtn.onclick = () => clearDraft();
    if (cancelBtn) cancelBtn.onclick = () => cancelEditing();
    if (importBtn) {
        importBtn.onclick = () => {
            if (pl.currentPlaylist.length === 0) { alert('La coda del player è vuota!'); return; }
            addTracks(pl.currentPlaylist);
        };
    }
    renderDraftUI();
}

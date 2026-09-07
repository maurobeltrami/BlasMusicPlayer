// events/playlistComposer.js - Gestione della bozza di playlist e salvataggio
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';

let draftTracks = [];

export function getDraftTracks() {
    return draftTracks;
}

export function addTrack(track) {
    draftTracks.push({ ...track, artist: (track.artist && track.artist !== "Locale") ? track.artist : "" });
    renderDraftUI();
}

export function addTracks(tracks) {
    tracks.forEach(t => draftTracks.push({ ...t, artist: (t.artist && t.artist !== "Locale") ? t.artist : "" }));
    renderDraftUI();
}

export function removeTrack(index) {
    draftTracks.splice(index, 1);
    renderDraftUI();
}

export function clearDraft() {
    draftTracks = [];
    renderDraftUI();
}

export function renderDraftUI() {
    const draftCountEl = document.getElementById('draftTracksCount');
    const draftListEl = document.getElementById('draftTracksList');
    if (draftCountEl) draftCountEl.textContent = draftTracks.length;
    if (!draftListEl) return;

    draftListEl.innerHTML = '';
    if (draftTracks.length === 0) {
        draftListEl.innerHTML = `
            <li class="p-3 text-center text-theme-muted italic border border-dashed border-box-border rounded text-[11px]">
                Clicca sul tasto <strong class="text-acid-pink font-bold">+</strong> sui brani a sinistra per comporre la tua playlist!
            </li>
        `;
        return;
    }

    draftTracks.forEach((t, idx) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between gap-2 p-1.5 bg-box-bg border border-box-border rounded hover:border-theme-accent text-xs';
        const artistLabel = (t.artist && t.artist !== 'Locale') ? `<span class="opacity-60 text-[10px] font-normal ml-1">(${t.artist})</span>` : '';
        li.innerHTML = `
            <div class="flex items-center gap-2 truncate flex-1">
                <span class="text-[10px] opacity-60 w-4 text-right font-mono">${idx + 1}.</span>
                <i class="fas fa-music text-acid-pink text-[10px]"></i>
                <span class="truncate font-semibold text-theme-text" title="${t.title}">${t.title}</span> ${artistLabel}
            </div>
            <button class="remove-draft-btn text-red-500 hover:text-red-700 p-1 rounded transition-colors shrink-0" title="Rimuovi dalla bozza">
                <i class="fas fa-times text-xs pointer-events-none"></i>
            </button>
        `;
        li.querySelector('.remove-draft-btn').onclick = () => removeTrack(idx);
        draftListEl.appendChild(li);
    });
}

export function setupPlaylistComposer(onPlaylistSavedCallback) {
    const nameInput = document.getElementById('playlistNameInput');
    const saveDraftBtn = document.getElementById('saveDraftPlaylistBtn');
    const clearDraftBtn = document.getElementById('clearDraftBtn');
    const importQueueBtn = document.getElementById('saveCurrentQueueAsPlaylistBtn');

    if (saveDraftBtn) {
        saveDraftBtn.onclick = async () => {
            const name = nameInput?.value?.trim();
            if (!name) {
                alert("Inserisci un nome per la playlist!");
                nameInput?.focus();
                return;
            }
            if (draftTracks.length === 0) {
                alert("Aggiungi almeno un brano con il tasto '+' prima di salvare la playlist!");
                return;
            }
            await stateManager.savePlaylist(name, draftTracks);
            clearDraft();
            if (nameInput) nameInput.value = '';
            if (onPlaylistSavedCallback) onPlaylistSavedCallback();
            alert(`Playlist "${name}" creata e salvata con successo!`);
        };
    }

    if (clearDraftBtn) {
        clearDraftBtn.onclick = () => clearDraft();
    }

    if (importQueueBtn) {
        importQueueBtn.onclick = () => {
            if (pl.currentPlaylist.length === 0) {
                alert("La coda del player è vuota!");
                return;
            }
            addTracks(pl.currentPlaylist);
        };
    }

    renderDraftUI();
}

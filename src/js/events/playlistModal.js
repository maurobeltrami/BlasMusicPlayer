// events/playlistModal.js - Modale per aggiungere/rimuovere brani dalle playlist
import * as stateManager from '../core/stateManager.js';

let currentTrack = null;
let onUpdatedCallback = null;

// Apre la modale per la traccia specificata e mostra le spunte delle playlist
export function openAddToPlaylistModal(track, onUpdated) {
    if (!track) return;
    currentTrack = track;
    onUpdatedCallback = onUpdated;

    const modal = document.getElementById('addToPlaylistModal');
    const titleEl = document.getElementById('modalTrackTitle');
    if (!modal) return;

    if (titleEl) {
        titleEl.textContent = track.title + (track.artist ? ` - ${track.artist}` : '');
    }

    renderPlaylistsList();
    modal.classList.remove('hidden');
}

// Chiude la modale e azzera lo stato temporaneo
export function closeAddToPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    if (modal) modal.classList.add('hidden');
    currentTrack = null;
}

// Renderizza l'elenco delle playlist con checkbox di stato per il brano corrente
function renderPlaylistsList() {
    const container = document.getElementById('modalPlaylistsList');
    if (!container) return;
    container.innerHTML = '';

    const playlists = stateManager.getSavedPlaylists();
    if (playlists.length === 0) {
        container.innerHTML = `
            <div class="text-xs text-theme-muted italic text-center p-4 border border-dashed border-box-border rounded">
                Nessuna playlist creata. Creane una nella sezione <strong>Playlist</strong>!
            </div>
        `;
        return;
    }

    playlists.forEach(p => {
        const isPresent = p.tracks.some(t => t.path === currentTrack.path);
        const row = document.createElement('label');
        row.className = 'flex items-center justify-between p-2.5 bg-box-bg hover:bg-theme-accent/20 border border-box-border rounded cursor-pointer transition-colors select-none';

        const left = document.createElement('div');
        left.className = 'flex items-center gap-2 truncate flex-1 min-w-0';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isPresent;
        checkbox.className = 'accent-theme-accent w-4 h-4 rounded cursor-pointer shrink-0';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-bold text-xs text-theme-text truncate';
        nameSpan.textContent = p.name;

        left.appendChild(checkbox);
        left.appendChild(nameSpan);

        const countSpan = document.createElement('span');
        countSpan.className = 'text-[10px] text-theme-muted font-mono shrink-0 ml-2';
        countSpan.textContent = `${p.tracks.length} brani`;

        checkbox.onchange = async () => {
            const allPlaylists = [...stateManager.getSavedPlaylists()];
            const target = allPlaylists.find(item => item.name === p.name);
            if (!target) return;

            if (checkbox.checked) {
                if (!target.tracks.some(t => t.path === currentTrack.path)) {
                    target.tracks.push({ ...currentTrack });
                }
            } else {
                target.tracks = target.tracks.filter(t => t.path !== currentTrack.path);
            }

            countSpan.textContent = `${target.tracks.length} brani`;
            await stateManager.saveAppState({ saved_playlists: allPlaylists });
            if (onUpdatedCallback) onUpdatedCallback();
        };

        row.appendChild(left);
        row.appendChild(countSpan);
        container.appendChild(row);
    });
}

// Inizializza i listener della modale (chiusura su click fuori o pulsante X)
export function setupPlaylistModal() {
    const modal = document.getElementById('addToPlaylistModal');
    const closeBtn = document.getElementById('closeAddToPlaylistModal');
    const doneBtn = document.getElementById('modalDoneBtn');

    if (closeBtn) closeBtn.onclick = () => closeAddToPlaylistModal();
    if (doneBtn) doneBtn.onclick = () => closeAddToPlaylistModal();

    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeAddToPlaylistModal();
        };
    }
}

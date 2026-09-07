// events/playlistsManager.js - Gestione creazione, selezione e ascolto delle playlist
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';
import { navigateTo } from '../ui/router.js';
import { setupPlaylistComposer } from './playlistComposer.js';
import { setupPlaylistFolderBrowser } from './playlistFolderBrowser.js';

export async function setupPlaylistsManager(loadTrackCallback, renderUICallback) {
    const savedPlaylistSelector = document.getElementById('savedPlaylistSelector');
    const loadSelectedPlaylistBtn = document.getElementById('loadSelectedPlaylistBtn');
    const goToPlaylistsBtn = document.getElementById('goToPlaylistsBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    const savedPlaylistsList = document.getElementById('savedPlaylistsList');
    const savedPlaylistsCount = document.getElementById('savedPlaylistsCount');
    const queueTracksCount = document.getElementById('queueTracksCount');

    async function refreshPlaylistsUI() {
        const playlists = await pl.getSavedPlaylists();

        if (savedPlaylistSelector) {
            const currentVal = savedPlaylistSelector.value;
            savedPlaylistSelector.innerHTML = '<option value="">-- Seleziona una Playlist --</option>';
            playlists.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.textContent = `${p.name} (${p.tracks.length} brani)`;
                savedPlaylistSelector.appendChild(opt);
            });
            if (currentVal) savedPlaylistSelector.value = currentVal;
        }

        if (queueTracksCount) queueTracksCount.textContent = pl.currentPlaylist.length;
        if (savedPlaylistsCount) savedPlaylistsCount.textContent = playlists.length;

        if (savedPlaylistsList) {
            savedPlaylistsList.innerHTML = '';
            if (playlists.length === 0) {
                savedPlaylistsList.innerHTML = '<li class="text-xs text-theme-muted p-4 text-center italic border border-dashed border-box-border rounded">Nessuna playlist salvata. Scegli i brani a sinistra con il tasto + per crearne una!</li>';
                return;
            }

            playlists.forEach(p => {
                const li = document.createElement('li');
                li.className = 'p-3 bg-box-bg border border-box-border rounded flex justify-between items-center shadow-sm';
                li.innerHTML = `
                    <div class="flex items-center gap-2 truncate">
                        <i class="fas fa-list-ul text-theme-accent"></i>
                        <span class="font-bold text-sm text-theme-text">${p.name}</span>
                        <span class="text-[10px] uppercase opacity-70 bg-theme-bg px-2 py-0.5 rounded font-semibold border border-box-border">${p.tracks.length} brani</span>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button class="play-pl-btn bg-theme-accent text-white px-2.5 py-1 rounded text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1" title="Riproduci ora">
                            <i class="fas fa-play text-[9px]"></i> Play
                        </button>
                        <button class="queue-pl-btn bg-theme-text text-theme-bg px-2 py-1 rounded text-xs font-bold hover:scale-105 transition-transform flex items-center gap-1" title="Aggiungi alla coda">
                            <i class="fas fa-plus text-[9px]"></i> Coda
                        </button>
                        <button class="del-pl-btn text-red-500 hover:text-red-700 p-1 rounded transition-colors" title="Elimina playlist">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                `;

                li.querySelector('.play-pl-btn').onclick = () => {
                    if (p.tracks.length > 0) {
                        pl.setPlaylists(p.tracks);
                        renderUICallback();
                        loadTrackCallback(0, true);
                        navigateTo('view-home');
                        if (savedPlaylistSelector) savedPlaylistSelector.value = p.name;
                    }
                };

                li.querySelector('.queue-pl-btn').onclick = () => {
                    p.tracks.forEach(t => pl.currentPlaylist.push(t));
                    renderUICallback();
                    refreshPlaylistsUI();
                };

                li.querySelector('.del-pl-btn').onclick = async () => {
                    await pl.deleteSavedPlaylist(p.name);
                    await refreshPlaylistsUI();
                };

                savedPlaylistsList.appendChild(li);
            });
        }
    }

    const loadFromSelector = async () => {
        if (!savedPlaylistSelector || !savedPlaylistSelector.value) return;
        const playlists = await pl.getSavedPlaylists();
        const selected = playlists.find(p => p.name === savedPlaylistSelector.value);
        if (selected && selected.tracks.length > 0) {
            pl.setPlaylists(selected.tracks);
            renderUICallback();
            loadTrackCallback(0, true);
        }
    };

    if (loadSelectedPlaylistBtn) loadSelectedPlaylistBtn.onclick = loadFromSelector;
    if (savedPlaylistSelector) savedPlaylistSelector.onchange = loadFromSelector;

    if (goToPlaylistsBtn) {
        goToPlaylistsBtn.onclick = () => {
            navigateTo('view-playlists');
            refreshPlaylistsUI();
        };
    }

    if (backToHomeBtn) backToHomeBtn.onclick = () => navigateTo('view-home');

    setupPlaylistComposer(() => refreshPlaylistsUI());
    const browser = await setupPlaylistFolderBrowser();

    window.addEventListener('view-changed', (e) => {
        if (e.detail?.view === 'view-playlists') {
            refreshPlaylistsUI();
            if (browser?.navigate) browser.navigate(stateManager.getLastFolder() || '');
        }
    });

    refreshPlaylistsUI();
    return { refreshPlaylistsUI };
}

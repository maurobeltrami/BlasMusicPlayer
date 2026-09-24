// events/playlistsManager.js - Gestione creazione, selezione e ascolto delle playlist
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';
import { navigateTo } from '../ui/router.js';
import { setupPlaylistComposer, loadPlaylistForEditing } from './playlistComposer.js';
import { setupPlaylistFolderBrowser } from './playlistFolderBrowser.js';

export async function setupPlaylistsManager(loadTrackCallback, renderUICallback) {
    const savedPlaylistSelector = document.getElementById('savedPlaylistSelector');
    const loadSelectedPlaylistBtn = document.getElementById('loadSelectedPlaylistBtn');
    const goToPlaylistsBtn  = document.getElementById('goToPlaylistsBtn');
    const backToHomeBtn     = document.getElementById('backToHomeBtn');
    const savedPlaylistsList = document.getElementById('savedPlaylistsList');
    const savedPlaylistsCount = document.getElementById('savedPlaylistsCount');
    const queueTracksCount  = document.getElementById('queueTracksCount');

    let isUpdatingSelector = false;

    async function refreshPlaylistsUI() {
        const playlists = await pl.getSavedPlaylists();

        if (savedPlaylistSelector) {
            isUpdatingSelector = true;
            const currentVal = savedPlaylistSelector.value;
            savedPlaylistSelector.innerHTML = '<option value="">-- Seleziona una Playlist --</option>';
            playlists.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.textContent = `${p.name} (${p.tracks.length} brani)`;
                savedPlaylistSelector.appendChild(opt);
            });
            if (currentVal) savedPlaylistSelector.value = currentVal;
            isUpdatingSelector = false;
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
                li.className = 'p-2.5 sm:p-3 bg-box-bg border border-box-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm min-w-0';
                li.innerHTML = `
                    <div class="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto flex-1">
                        <div class="flex items-center gap-2 min-w-0 flex-1">
                            <i class="fas fa-list-ul text-theme-accent shrink-0 text-sm"></i>
                            <span class="font-bold text-sm text-theme-text truncate" title="${p.name}">${p.name}</span>
                            <span class="text-[10px] uppercase opacity-75 bg-theme-bg px-2 py-0.5 rounded font-semibold border border-box-border shrink-0">${p.tracks.length} brani</span>
                        </div>
                        <button class="del-pl-btn text-red-400 hover:text-red-600 p-1.5 rounded transition-colors sm:hidden shrink-0" title="Elimina playlist">
                            <i class="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-1.5 sm:pt-0 border-t border-box-border/30 sm:border-t-0">
                        <button class="play-pl-btn flex-1 sm:flex-initial bg-theme-accent text-white px-2.5 py-1.5 rounded text-xs font-bold hover:scale-102 active:scale-95 transition-transform flex items-center justify-center gap-1 touch-manipulation" title="Riproduci ora">
                            <i class="fas fa-play text-[10px]"></i> Play
                        </button>
                        <button class="queue-pl-btn flex-1 sm:flex-initial bg-theme-text text-theme-bg px-2.5 py-1.5 rounded text-xs font-bold hover:scale-102 active:scale-95 transition-transform flex items-center justify-center gap-1 touch-manipulation" title="Aggiungi alla coda">
                            <i class="fas fa-plus text-[10px]"></i> Coda
                        </button>
                        <button class="edit-pl-btn flex-1 sm:flex-initial bg-acid-blue text-theme-text px-2.5 py-1.5 rounded text-xs font-bold hover:scale-102 active:scale-95 transition-transform flex items-center justify-center gap-1 touch-manipulation" title="Modifica playlist nel compositore">
                            <i class="fas fa-pencil-alt text-[10px]"></i> Modifica
                        </button>
                        <button class="del-pl-btn text-red-400 hover:text-red-600 p-1.5 rounded transition-colors hidden sm:block shrink-0" title="Elimina playlist">
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
                li.querySelector('.edit-pl-btn').onclick = () => {
                    loadPlaylistForEditing(p);
                };
                li.querySelectorAll('.del-pl-btn').forEach(btn => {
                    btn.onclick = async () => {
                        await pl.deleteSavedPlaylist(p.name);
                        await refreshPlaylistsUI();
                    };
                });
                savedPlaylistsList.appendChild(li);
            });
        }
    }

    const loadFromSelector = async () => {
        if (isUpdatingSelector || !savedPlaylistSelector || !savedPlaylistSelector.value) return;
        const playlists = await pl.getSavedPlaylists();
        const selected  = playlists.find(p => p.name === savedPlaylistSelector.value);
        if (selected && selected.tracks.length > 0) {
            pl.setPlaylists(selected.tracks);
            renderUICallback();
            loadTrackCallback(0, true);
        }
    };

    if (loadSelectedPlaylistBtn) loadSelectedPlaylistBtn.onclick = loadFromSelector;
    if (savedPlaylistSelector)   savedPlaylistSelector.onchange  = loadFromSelector;
    if (goToPlaylistsBtn) goToPlaylistsBtn.onclick = () => { navigateTo('view-playlists'); refreshPlaylistsUI(); };
    if (backToHomeBtn)    backToHomeBtn.onclick    = () => navigateTo('view-home');

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

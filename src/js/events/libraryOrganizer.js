// events/libraryOrganizer.js - Raggruppamento per Artisti, Album e Ricerca in tempo reale
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';
import { groupByKey, renderGroupDetail, renderMapList, renderPlainTracks } from './libraryRenderer.js';

let currentMode = 'folders';
let searchQuery = '';
let cachedTracks = [];
let recursiveTracks = null;
let selectedGroup = null;

export const getLibraryMode = () => currentMode;
export const clearRecursiveCache = () => { recursiveTracks = null; selectedGroup = null; };
export const updateLibraryTracks = (tracks) => { cachedTracks = tracks || []; };

export function setupLibraryOrganizer(loadTrackCb, renderUICb, renderFolderCb) {
    const searchInput = document.getElementById('librarySearchInput');
    const clearSearchBtn = document.getElementById('clearLibrarySearchBtn');
    const folderControls = document.getElementById('folderNavControls');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const dirList = document.getElementById('dirList');
    const tabs = ['tabModeFolders', 'tabModeArtists', 'tabModeAlbums'];

    const setMode = async (mode) => {
        currentMode = mode;
        selectedGroup = null;
        tabs.forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const active = btn.dataset.mode === mode;
            btn.className = `flex-1 py-1 px-1.5 rounded text-xs font-bold transition-all text-center flex items-center justify-center gap-1 touch-manipulation ${
                active ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-text hover:bg-box-bg'
            }`;
        });
        if (folderControls) folderControls.classList.toggle('hidden', mode !== 'folders' || searchQuery.length > 0);
        if (browseFolderBtn) browseFolderBtn.classList.toggle('hidden', mode !== 'folders');

        if (mode === 'folders' && searchQuery.length === 0) {
            updateLabel('<i class="fas fa-folder mr-1"></i> Memoria & Cartelle');
            renderFolderCb();
        } else {
            await ensureAndRender(dirList, loadTrackCb, renderUICb);
        }
    };

    tabs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => setMode(btn.dataset.mode);
    });

    if (searchInput) {
        searchInput.oninput = async (e) => {
            searchQuery = (e.target.value || '').trim().toLowerCase();
            selectedGroup = null;
            if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
            if (folderControls) folderControls.classList.toggle('hidden', currentMode !== 'folders' || searchQuery.length > 0);
            await ensureAndRender(dirList, loadTrackCb, renderUICb);
        };
    }

    if (clearSearchBtn && searchInput) {
        clearSearchBtn.onclick = () => {
            searchInput.value = '';
            searchQuery = '';
            clearSearchBtn.classList.add('hidden');
            setMode(currentMode);
        };
    }
}

const updateLabel = (html) => {
    const el = document.getElementById('librarySectionLabel');
    if (el) el.innerHTML = html;
};

async function ensureAndRender(container, loadTrackCb, renderUICb) {
    if (!container) return;
    if (!recursiveTracks && window.__TAURI__?.core) {
        container.innerHTML = '<div class="p-4 text-center text-xs opacity-70"><i class="fas fa-spinner fa-spin mr-1"></i> Scansione libreria audio...</div>';
        try {
            const path = stateManager.getLastFolder() || (await window.__TAURI__.core.invoke('get_music_dir'));
            const raw = await window.__TAURI__.core.invoke('scan_folder_recursive', { dirPath: path });
            recursiveTracks = (raw || []).map(t => ({
                title: t.title,
                path: t.path,
                artist: (t.artist && t.artist !== "Locale") ? t.artist : "",
                album: t.album || "",
                cover: t.cover
            }));
        } catch (_) { recursiveTracks = []; }
    }
    renderGroupedUI(container, loadTrackCb, renderUICb);
}

function renderGroupedUI(container, loadTrackCb, renderUICb) {
    const all = (recursiveTracks && recursiveTracks.length > 0) ? recursiveTracks : cachedTracks;
    let tracks = all;
    if (searchQuery.length > 0) {
        tracks = tracks.filter(t => (t.title || '').toLowerCase().includes(searchQuery) ||
                                    (t.artist || '').toLowerCase().includes(searchQuery) ||
                                    (t.album || '').toLowerCase().includes(searchQuery));
        updateLabel(`<i class="fas fa-search mr-1"></i> Risultati (${tracks.length})`);
    } else {
        updateLabel(currentMode === 'artists' ? '<i class="fas fa-user mr-1"></i> Artisti' : '<i class="fas fa-compact-disc mr-1"></i> Album');
    }

    container.innerHTML = '';
    if (tracks.length === 0) {
        container.innerHTML = '<div class="p-3 text-center text-xs opacity-70 italic font-semibold">Nessun brano trovato</div>';
        return;
    }

    if (selectedGroup) {
        const isArt = currentMode === 'artists';
        renderGroupDetail(container, tracks, selectedGroup, isArt, 
            () => { selectedGroup = null; renderGroupedUI(container, loadTrackCb, renderUICb); },
            (list) => { pl.setPlaylists(list); renderUICb(); loadTrackCb(0, true); },
            loadTrackCb, renderUICb);
        return;
    }

    if (currentMode === 'artists' && searchQuery.length === 0) {
        const onSelect = (name) => { selectedGroup = name; renderGroupedUI(container, loadTrackCb, renderUICb); };
        const onPlay = (list) => { pl.setPlaylists(list); renderUICb(); loadTrackCb(0, true); };
        renderMapList(container, groupByKey(tracks, t => t.artist || 'Sconosciuto'), 'fa-microphone', 'text-acid-green', onSelect, onPlay);
    } else if (currentMode === 'albums' && searchQuery.length === 0) {
        const onSelect = (name) => { selectedGroup = name; renderGroupedUI(container, loadTrackCb, renderUICb); };
        const onPlay = (list) => { pl.setPlaylists(list); renderUICb(); loadTrackCb(0, true); };
        renderMapList(container, groupByKey(tracks, t => t.album || 'Singoli'), 'fa-compact-disc', 'text-acid-pink', onSelect, onPlay);
    } else {
        renderPlainTracks(container, tracks, loadTrackCb, renderUICb);
    }
}

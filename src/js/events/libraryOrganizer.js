// events/libraryOrganizer.js - Raggruppamento per Artisti, Album e Ricerca in tempo reale
import * as pl from '../data/playlist.js';

let currentMode = 'folders';
let searchQuery = '';
let cachedTracks = [];

export const getLibraryMode = () => currentMode;
export const updateLibraryTracks = (tracks) => { cachedTracks = tracks || []; };

export function setupLibraryOrganizer(loadTrackCallback, renderUICallback, renderFolderCallback) {
    const searchInput = document.getElementById('librarySearchInput');
    const clearSearchBtn = document.getElementById('clearLibrarySearchBtn');
    const folderControls = document.getElementById('folderNavControls');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const dirList = document.getElementById('dirList');
    const tabs = ['tabModeFolders', 'tabModeArtists', 'tabModeAlbums'];

    const setMode = (mode) => {
        currentMode = mode;
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
            renderFolderCallback();
        } else {
            renderGroupedUI(dirList, loadTrackCallback, renderUICallback);
        }
    };

    tabs.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => setMode(btn.dataset.mode);
    });

    if (searchInput) {
        searchInput.oninput = (e) => {
            searchQuery = (e.target.value || '').trim().toLowerCase();
            if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
            if (folderControls) folderControls.classList.toggle('hidden', currentMode !== 'folders' || searchQuery.length > 0);
            renderGroupedUI(dirList, loadTrackCallback, renderUICallback);
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
    return { setMode };
}

const updateLabel = (html) => {
    const el = document.getElementById('librarySectionLabel');
    if (el) el.innerHTML = html;
};

function renderGroupedUI(container, loadTrackCallback, renderUICallback) {
    if (!container) return;
    let tracks = cachedTracks;
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

    if (currentMode === 'artists' && searchQuery.length === 0) {
        renderMapList(container, groupByKey(tracks, t => t.artist || 'Sconosciuto'), 'fa-microphone', 'text-acid-green', loadTrackCallback, renderUICallback);
    } else if (currentMode === 'albums' && searchQuery.length === 0) {
        renderMapList(container, groupByKey(tracks, t => t.album || 'Singoli'), 'fa-compact-disc', 'text-acid-pink', loadTrackCallback, renderUICallback);
    } else {
        renderPlainTracks(container, tracks, loadTrackCallback, renderUICallback);
    }
}

function groupByKey(list, keyGetter) {
    const map = new Map();
    list.forEach(item => {
        const k = keyGetter(item);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(item);
    });
    return map;
}

function renderMapList(container, map, icon, colorClass, loadTrackCallback, renderUICallback) {
    Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([name, trackList]) => {
        const div = document.createElement('div');
        div.className = 'p-2 bg-theme-bg/60 hover:bg-theme-accent hover:text-white rounded text-xs font-semibold flex items-center justify-between gap-1.5 transition-colors cursor-pointer touch-manipulation group';
        div.innerHTML = `
            <div class="flex items-center gap-2 truncate flex-1 min-w-0">
                <i class="fas ${icon} ${colorClass} group-hover:text-white text-sm shrink-0"></i>
                <span class="truncate font-bold">${name}</span>
                <span class="text-[10px] opacity-70 bg-box-bg px-1.5 py-0.2 rounded border border-box-border shrink-0">${trackList.length}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button class="p-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded play-grp-btn" title="Riproduci"><i class="fas fa-play text-[10px]"></i></button>
                <button class="p-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded add-grp-btn" title="Aggiungi"><i class="fas fa-plus text-[10px]"></i></button>
            </div>
        `;
        div.querySelector('.play-grp-btn').onclick = (e) => { e.stopPropagation(); pl.setPlaylists(trackList); renderUICallback(); loadTrackCallback(0, true); };
        div.querySelector('.add-grp-btn').onclick = (e) => { e.stopPropagation(); trackList.forEach(t => pl.currentPlaylist.push(t)); renderUICallback(); };
        div.onclick = () => div.querySelector('.play-grp-btn').click();
        container.appendChild(div);
    });
}

function renderPlainTracks(container, tracks, loadTrackCallback, renderUICallback) {
    tracks.forEach((track, idx) => {
        const row = document.createElement('div');
        row.className = 'group flex items-center justify-between gap-1.5 p-2 hover:bg-theme-accent hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer touch-manipulation';
        const artist = track.artist ? `<span class="opacity-60 text-[10px] ml-1">(${track.artist})</span>` : '';
        row.innerHTML = `<div class="flex items-center gap-2 truncate flex-1 min-w-0"><i class="fas fa-music text-acid-pink group-hover:text-white text-sm shrink-0"></i><span class="truncate">${track.title}</span>${artist}</div><button class="p-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded add-btn shrink-0" title="Aggiungi"><i class="fas fa-plus text-[10px]"></i></button>`;
        row.onclick = () => { pl.setPlaylists(tracks); renderUICallback(); loadTrackCallback(idx, true); };
        row.querySelector('.add-btn').onclick = (e) => { e.stopPropagation(); pl.currentPlaylist.push(track); renderUICallback(); };
        container.appendChild(row);
    });
}

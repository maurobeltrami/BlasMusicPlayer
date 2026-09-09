// events/navigation.js - Navigazione cartelle nativa e riproduzione sottocartelle
import * as pl from '../data/playlist.js';
import * as stateManager from '../core/stateManager.js';

export let currentDirectory = "";

export async function setupNavigation(loadTrackCallback, renderUICallback) {
    const dirUpBtn = document.getElementById('dirUpBtn');
    const dirList = document.getElementById('dirList');
    const currentDirDisplay = document.getElementById('currentDirDisplay');
    const playCurrentFolderBtn = document.getElementById('playCurrentFolderBtn');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const quickContainer = document.getElementById('quickDirsContainer');

    async function loadShortcuts() {
        if (!quickContainer || !window.__TAURI__?.core) return;
        try {
            const list = await window.__TAURI__.core.invoke('get_common_dirs');
            quickContainer.innerHTML = '';
            list.forEach(s => {
                const btn = document.createElement('button');
                btn.className = 'px-2.5 py-1 bg-box-bg hover:bg-theme-accent hover:text-white border border-box-border rounded text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 touch-manipulation';
                btn.innerHTML = `<i class="fas ${s.icon} text-acid-green"></i> ${s.name}`;
                btn.onclick = () => navigate(s.path);
                quickContainer.appendChild(btn);
            });
        } catch (_) {}
    }

    async function playFolderTracks(path, appendOnly = false) {
        if (!window.__TAURI__?.core) return;
        try {
            stateManager.setLastFolder(path);
            const raw = await window.__TAURI__.core.invoke('scan_folder_recursive', { dirPath: path });
            if (!raw || raw.length === 0) { navigate(path); return; }
            const tracks = raw.map(t => ({ ...t, artist: (t.artist && t.artist !== "Locale") ? t.artist : "" }));
            if (appendOnly) {
                const start = pl.currentPlaylist.length;
                tracks.forEach(t => pl.currentPlaylist.push(t));
                renderUICallback();
                if (!pl.isPlaying) loadTrackCallback(start, true);
            } else {
                pl.setPlaylists(tracks);
                renderUICallback();
                loadTrackCallback(0, true);
            }
            stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
        } catch (err) { console.error("Errore riproduzione cartella:", err); }
    }

    async function navigate(path) {
        if (!window.__TAURI__?.core) return;
        try {
            if (!path) path = stateManager.getLastFolder() || (await window.__TAURI__.core.invoke('get_music_dir'));
            currentDirectory = path;
            stateManager.setLastFolder(path);
            if (currentDirDisplay) { currentDirDisplay.textContent = path; currentDirDisplay.title = path; }
            const items = await window.__TAURI__.core.invoke('scan_directory', { dirPath: path });
            if (!dirList) return;
            dirList.innerHTML = items.length === 0 ? '<div class="p-3 text-center text-xs opacity-70 font-semibold italic">Nessun file audio o cartella trovato</div>' : '';
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'group flex items-center justify-between gap-1.5 p-2 hover:bg-theme-accent hover:text-white rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer touch-manipulation';
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 truncate flex-1';

                if (item.is_dir) {
                    left.innerHTML = `<i class="fas fa-folder text-acid-green group-hover:text-white text-sm"></i> <span class="truncate" title="${item.name}">${item.name}</span>`;
                    row.onclick = () => navigate(item.path);
                    const actions = document.createElement('div');
                    actions.className = 'flex items-center gap-1 shrink-0';
                    actions.innerHTML = `
                        <button class="p-1.5 px-2 text-white bg-black/40 hover:bg-black/80 rounded transition-transform active:scale-95 play-sub-btn" title="Riproduci"><i class="fas fa-play text-xs pointer-events-none"></i></button>
                        <button class="p-1.5 px-2 text-white bg-black/40 hover:bg-black/80 rounded transition-transform active:scale-95 add-sub-btn" title="Aggiungi"><i class="fas fa-plus text-xs pointer-events-none"></i></button>
                    `;
                    actions.querySelector('.play-sub-btn').onclick = (e) => { e.stopPropagation(); playFolderTracks(item.path, false); };
                    actions.querySelector('.add-sub-btn').onclick = (e) => { e.stopPropagation(); playFolderTracks(item.path, true); };
                    row.appendChild(left);
                    row.appendChild(actions);
                } else {
                    const trackTitle = item.title || item.name.replace(/\.[^/.]+$/, "");
                    const trackArtist = (item.artist && item.artist !== "Locale") ? item.artist : "";
                    const artistBadge = trackArtist ? `<span class="opacity-60 text-xs font-normal ml-1">(${trackArtist})</span>` : '';
                    left.innerHTML = `<i class="fas fa-music text-acid-pink group-hover:text-white text-sm"></i> <span class="truncate" title="${trackTitle}">${trackTitle}</span> ${artistBadge}`;
                    const track = { title: trackTitle, path: item.path, artist: trackArtist, cover: item.cover };
                    row.onclick = () => {
                        pl.currentPlaylist.push(track);
                        renderUICallback();
                        loadTrackCallback(pl.currentPlaylist.length - 1, true);
                        stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
                    };
                    const addBtn = document.createElement('button');
                    addBtn.className = 'p-1.5 px-2.5 text-white bg-black/40 hover:bg-black/80 rounded transition-transform active:scale-95 shrink-0';
                    addBtn.title = 'Aggiungi';
                    addBtn.innerHTML = '<i class="fas fa-plus text-xs pointer-events-none"></i>';
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        pl.currentPlaylist.push(track);
                        renderUICallback();
                        stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
                    };
                    row.appendChild(left);
                    row.appendChild(addBtn);
                }
                dirList.appendChild(row);
            });
        } catch (err) { console.error("Errore navigazione cartella:", err); }
    }

    if (dirUpBtn) {
        dirUpBtn.onclick = () => {
            if (!currentDirectory) return;
            if (currentDirectory.includes('/Android/data') || currentDirectory.includes('/Android/obb')) {
                navigate('/storage/emulated/0');
                return;
            }
            if (currentDirectory === '/storage/emulated/0') return;
            const parts = currentDirectory.split(/[\/\\]/).filter(Boolean);
            if (parts.length > 0) {
                parts.pop();
                const parent = (currentDirectory.startsWith('/') ? '/' : '') + parts.join('/');
                navigate(parent || '/');
            }
        };
    }
    if (playCurrentFolderBtn) playCurrentFolderBtn.onclick = () => playFolderTracks(currentDirectory, false);

    if (browseFolderBtn) {
        browseFolderBtn.onclick = async () => {
            if (!window.__TAURI__?.core) return;
            try {
                const res = await window.__TAURI__.core.invoke('pick_audio_folder');
                if (res?.folder_path && res.folder_path !== currentDirectory) {
                    await navigate(res.folder_path);
                    if (res.tracks?.length > 0) {
                        pl.setPlaylists(res.tracks.map(t => ({ ...t, artist: (t.artist && t.artist !== "Locale") ? t.artist : "" })));
                        renderUICallback();
                        loadTrackCallback(0, true);
                    }
                } else {
                    navigate('/storage/emulated/0');
                }
            } catch (err) { console.error("Errore selezione cartella:", err); }
        };
    }

    await loadShortcuts();
    await navigate('');
}

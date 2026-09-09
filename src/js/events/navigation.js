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
            dirList.innerHTML = '';
            if (items.length === 0) {
                dirList.innerHTML = '<div class="p-3 text-center text-xs opacity-60 font-semibold italic">Nessun file audio o cartella</div>';
                return;
            }
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'group flex items-center justify-between gap-1 p-1.5 hover:bg-theme-accent hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer touch-manipulation';
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 truncate flex-1';

                if (item.is_dir) {
                    left.innerHTML = `<i class="fas fa-folder text-acid-green group-hover:text-white"></i> <span class="truncate" title="${item.name}">${item.name}</span>`;
                    row.onclick = () => navigate(item.path);
                    const actions = document.createElement('div');
                    actions.className = 'flex items-center gap-1 shrink-0';
                    actions.innerHTML = `
                        <button class="p-1 px-1.5 text-white bg-black/40 hover:bg-black/80 rounded transition-transform hover:scale-110 play-sub-btn" title="Riproduci questa sottocartella"><i class="fas fa-play text-[9px] pointer-events-none"></i></button>
                        <button class="p-1 px-1.5 text-white bg-black/40 hover:bg-black/80 rounded transition-transform hover:scale-110 add-sub-btn" title="Aggiungi sottocartella alla coda"><i class="fas fa-plus text-[9px] pointer-events-none"></i></button>
                    `;
                    actions.querySelector('.play-sub-btn').onclick = (e) => { e.stopPropagation(); playFolderTracks(item.path, false); };
                    actions.querySelector('.add-sub-btn').onclick = (e) => { e.stopPropagation(); playFolderTracks(item.path, true); };
                    row.appendChild(left);
                    row.appendChild(actions);
                } else {
                    const trackTitle = item.title || item.name.replace(/\.[^/.]+$/, "");
                    const trackArtist = (item.artist && item.artist !== "Locale") ? item.artist : "";
                    const artistBadge = trackArtist ? `<span class="opacity-60 text-[10px] font-normal ml-1">(${trackArtist})</span>` : '';
                    left.innerHTML = `<i class="fas fa-music text-acid-pink group-hover:text-white"></i> <span class="truncate" title="${trackTitle}">${trackTitle}</span> ${artistBadge}`;
                    const track = { title: trackTitle, path: item.path, artist: trackArtist, cover: item.cover };
                    row.onclick = () => {
                        pl.currentPlaylist.push(track);
                        renderUICallback();
                        loadTrackCallback(pl.currentPlaylist.length - 1, true);
                        stateManager.saveQueueState(pl.currentPlaylist, pl.currentTrackIndex);
                    };
                    const addBtn = document.createElement('button');
                    addBtn.className = 'p-1 px-1.5 text-white bg-black/40 hover:bg-black/80 rounded transition-transform hover:scale-110 shrink-0';
                    addBtn.title = 'Aggiungi brano alla coda';
                    addBtn.innerHTML = '<i class="fas fa-plus text-[9px] pointer-events-none"></i>';
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
                if (res) {
                    if (res.folder_path) await navigate(res.folder_path);
                    if (res.tracks && res.tracks.length > 0) {
                        pl.setPlaylists(res.tracks.map(t => ({ ...t, artist: (t.artist && t.artist !== "Locale") ? t.artist : "" })));
                        renderUICallback();
                        loadTrackCallback(0, true);
                        stateManager.saveQueueState(pl.currentPlaylist, 0);
                    }
                }
            } catch (err) { console.error("Errore selezione cartella:", err); }
        };
    }

    await navigate('');
}

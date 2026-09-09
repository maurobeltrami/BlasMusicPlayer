// events/playlistFolderBrowser.js - Esplorazione cartelle per selezione tracce playlist
import * as composer from './playlistComposer.js';
import * as stateManager from '../core/stateManager.js';

let currentDirectory = "";
let currentFolderTracks = [];

export async function setupPlaylistFolderBrowser() {
    const dirUpBtn = document.getElementById('plDirUpBtn');
    const browseFolderBtn = document.getElementById('plBrowseFolderBtn');
    const addAllFolderTracksBtn = document.getElementById('plAddAllFolderTracksBtn');
    const dirList = document.getElementById('plDirList');
    const currentDirDisplay = document.getElementById('plCurrentDirDisplay');
    const quickContainer = document.getElementById('plQuickDirsContainer');

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

    async function navigate(path) {
        if (!window.__TAURI__?.core) return;
        try {
            if (!path) path = stateManager.getLastFolder() || (await window.__TAURI__.core.invoke('get_music_dir'));
            currentDirectory = path;
            stateManager.setLastFolder(path);
            if (currentDirDisplay) { currentDirDisplay.textContent = path; currentDirDisplay.title = path; }
            if (!dirList) return;
            dirList.innerHTML = '<div class="p-3 text-center text-xs opacity-60 italic">Caricamento...</div>';
            const items = await window.__TAURI__.core.invoke('scan_directory', { dirPath: path });
            dirList.innerHTML = '';
            currentFolderTracks = [];
            if (items.length === 0) {
                dirList.innerHTML = '<div class="p-3 text-center text-xs opacity-70 font-semibold italic">Nessun file audio o cartella trovato</div>';
                return;
            }
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'group flex items-center justify-between gap-2 p-2 hover:bg-theme-accent hover:text-white rounded text-xs sm:text-sm font-semibold transition-colors cursor-pointer touch-manipulation';
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 truncate flex-1';

                if (item.is_dir) {
                    left.innerHTML = `<i class="fas fa-folder text-acid-green group-hover:text-white text-sm"></i> <span class="truncate" title="${item.name}">${item.name}</span>`;
                    row.onclick = () => navigate(item.path);
                    const act = document.createElement('div');
                    act.className = 'flex items-center gap-1 shrink-0';
                    act.innerHTML = `<button class="py-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded transition-transform active:scale-95 add-dir-btn" title="Aggiungi tutti"><i class="fas fa-plus text-xs mr-1"></i>Cartella</button>`;
                    act.querySelector('.add-dir-btn').onclick = async (e) => {
                        e.stopPropagation();
                        const raw = await window.__TAURI__.core.invoke('scan_folder_recursive', { dirPath: item.path });
                        if (raw?.length > 0) composer.addTracks(raw);
                    };
                    row.appendChild(left);
                    row.appendChild(act);
                } else {
                    const trackTitle = item.title || item.name.replace(/\.[^/.]+$/, "");
                    const trackArtist = (item.artist && item.artist !== "Locale") ? item.artist : "";
                    const track = { title: trackTitle, path: item.path, artist: trackArtist, cover: item.cover };
                    currentFolderTracks.push(track);
                    const badge = trackArtist ? `<span class="opacity-60 text-xs font-normal ml-1">(${trackArtist})</span>` : '';
                    left.innerHTML = `<i class="fas fa-music text-acid-pink group-hover:text-white text-sm"></i> <span class="truncate" title="${trackTitle}">${trackTitle}</span> ${badge}`;
                    const addBtn = document.createElement('button');
                    addBtn.className = 'py-1 px-2.5 bg-theme-accent text-white font-bold rounded shadow transition-transform active:scale-95 shrink-0 flex items-center gap-1';
                    addBtn.title = 'Aggiungi alla playlist';
                    addBtn.innerHTML = '<i class="fas fa-plus text-xs pointer-events-none"></i>';
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        composer.addTrack(track);
                        addBtn.classList.add('bg-acid-green');
                        setTimeout(() => addBtn.classList.remove('bg-acid-green'), 200);
                    };
                    row.onclick = () => composer.addTrack(track);
                    row.appendChild(left);
                    row.appendChild(addBtn);
                }
                dirList.appendChild(row);
            });
        } catch (err) { console.error("Errore esplorazione cartella playlist:", err); }
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

    if (browseFolderBtn) {
        browseFolderBtn.onclick = async () => {
            if (!window.__TAURI__?.core) return;
            try {
                const res = await window.__TAURI__.core.invoke('pick_audio_folder');
                if (res?.folder_path && res.folder_path !== currentDirectory) {
                    await navigate(res.folder_path);
                } else {
                    navigate('/storage/emulated/0');
                }
            } catch (err) { console.error("Errore apertura cartella:", err); }
        };
    }

    if (addAllFolderTracksBtn) {
        addAllFolderTracksBtn.onclick = () => {
            if (currentFolderTracks.length === 0) return alert("Nessun brano trovato nella cartella corrente!");
            composer.addTracks(currentFolderTracks);
        };
    }

    await loadShortcuts();
    await navigate('');
    return { navigate };
}

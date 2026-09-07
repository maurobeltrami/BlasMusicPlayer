// events/playlistFolderBrowser.js - Navigazione cartelle e selezione brani con '+' per playlist
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

    async function navigate(path) {
        if (!window.__TAURI__?.core) return;
        try {
            if (!path) path = stateManager.getLastFolder() || (await window.__TAURI__.core.invoke('get_music_dir'));
            currentDirectory = path;
            stateManager.setLastFolder(path);
            if (currentDirDisplay) { currentDirDisplay.textContent = path; currentDirDisplay.title = path; }
            if (!dirList) return;
            dirList.innerHTML = '<div class="p-4 text-center text-xs opacity-60 italic">Caricamento...</div>';

            const items = await window.__TAURI__.core.invoke('scan_directory', { dirPath: path });
            dirList.innerHTML = '';
            currentFolderTracks = [];

            if (items.length === 0) {
                dirList.innerHTML = '<div class="p-4 text-center text-xs opacity-60 italic">Nessun file audio o cartella trovato</div>';
                return;
            }

            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'group flex items-center justify-between gap-2 p-1.5 hover:bg-theme-accent hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer';
                const left = document.createElement('div');
                left.className = 'flex items-center gap-2 truncate flex-1';

                if (item.is_dir) {
                    left.innerHTML = `<i class="fas fa-folder text-acid-green group-hover:text-white"></i> <span class="truncate" title="${item.name}">${item.name}</span>`;
                    row.onclick = () => navigate(item.path);
                    const actions = document.createElement('div');
                    actions.className = 'flex items-center gap-1 shrink-0';
                    actions.innerHTML = `
                        <button class="p-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded transition-transform hover:scale-110 add-folder-btn" title="Aggiungi tutti i brani di questa cartella"><i class="fas fa-plus text-[9px] mr-1"></i>Cartella</button>
                    `;
                    actions.querySelector('.add-folder-btn').onclick = async (e) => {
                        e.stopPropagation();
                        const raw = await window.__TAURI__.core.invoke('scan_folder_recursive', { dirPath: item.path });
                        if (raw?.length > 0) composer.addTracks(raw);
                    };
                    row.appendChild(left);
                    row.appendChild(actions);
                    const trackTitle = item.title || item.name.replace(/\.[^/.]+$/, "");
                    const trackArtist = (item.artist && item.artist !== "Locale") ? item.artist : "";
                    const track = { title: trackTitle, path: item.path, artist: trackArtist, cover: item.cover };
                    currentFolderTracks.push(track);
                    const artistBadge = trackArtist ? `<span class="opacity-60 text-[10px] font-normal ml-1">(${trackArtist})</span>` : '';
                    left.innerHTML = `<i class="fas fa-music text-acid-pink group-hover:text-white"></i> <span class="truncate" title="${trackTitle}">${trackTitle}</span> ${artistBadge}`;
                    const addBtn = document.createElement('button');
                    addBtn.className = 'p-1 px-2.5 bg-theme-accent text-white font-bold rounded shadow transition-transform hover:scale-110 shrink-0 flex items-center gap-1';
                    addBtn.title = 'Aggiungi alla nuova playlist';
                    addBtn.innerHTML = '<i class="fas fa-plus text-xs pointer-events-none"></i>';
                    addBtn.onclick = (e) => {
                        e.stopPropagation();
                        composer.addTrack(track);
                        addBtn.classList.add('scale-125', 'bg-acid-green');
                        setTimeout(() => addBtn.classList.remove('scale-125', 'bg-acid-green'), 200);
                    };
                    row.onclick = () => composer.addTrack(track);
                    row.appendChild(left);
                    row.appendChild(addBtn);
                }
                dirList.appendChild(row);
            });
        } catch (err) {
            console.error("Errore esplorazione cartella per playlist:", err);
        }
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

    if (browseFolderBtn) {
        browseFolderBtn.onclick = async () => {
            if (!window.__TAURI__?.core) return;
            try {
                const res = await window.__TAURI__.core.invoke('pick_audio_folder');
                if (res?.folder_path) await navigate(res.folder_path);
            } catch (err) { console.error("Errore apertura cartella:", err); }
        };
    }

    if (addAllFolderTracksBtn) {
        addAllFolderTracksBtn.onclick = () => {
            if (currentFolderTracks.length === 0) {
                alert("Nessun brano trovato nella cartella corrente da aggiungere!");
                return;
            }
            composer.addTracks(currentFolderTracks);
        };
    }

    await navigate('');
    return { navigate };
}

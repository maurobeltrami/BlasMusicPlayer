// events/libraryRenderer.js - Rendering dettagli, elenchi raggruppati e tracce plain
import * as pl from '../data/playlist.js';

export function groupByKey(list, keyGetter) {
    const map = new Map();
    list.forEach(item => {
        const k = keyGetter(item);
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(item);
    });
    return map;
}

export function renderGroupDetail(container, allTracks, groupName, isArtist, onBack, onPlay, loadTrackCb, renderUICb) {
    const field = isArtist ? 'artist' : 'album';
    const fallback = isArtist ? 'Sconosciuto' : 'Singoli';
    const filtered = allTracks.filter(t => (t[field] || fallback) === groupName);

    const header = document.createElement('div');
    header.className = 'flex items-center justify-between p-2 mb-1.5 bg-box-bg border border-box-border rounded text-xs';
    header.innerHTML = `
        <button class="font-bold text-acid-green hover:underline flex items-center gap-1 cursor-pointer" id="backBtn">
            <i class="fas fa-arrow-left"></i> ${isArtist ? 'Artisti' : 'Album'}
        </button>
        <span class="font-bold truncate max-w-[140px]">${groupName}</span>
        <button class="px-2 py-0.5 bg-theme-accent text-white font-bold rounded" id="playAllBtn">Play (${filtered.length})</button>
    `;
    header.querySelector('#backBtn').onclick = onBack;
    header.querySelector('#playAllBtn').onclick = () => onPlay(filtered);
    container.appendChild(header);
    renderPlainTracks(container, filtered, loadTrackCb, renderUICb);
}

export function renderMapList(container, map, icon, colorClass, onSelect, onPlayAll) {
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
            </div>
        `;
        div.querySelector('.play-grp-btn').onclick = (e) => { e.stopPropagation(); onPlayAll(trackList); };
        div.onclick = () => onSelect(name);
        container.appendChild(div);
    });
}

export function renderPlainTracks(container, tracks, loadTrackCb, renderUICb) {
    tracks.forEach((track, idx) => {
        const row = document.createElement('div');
        row.className = 'group flex items-center justify-between gap-1.5 p-2 hover:bg-theme-accent hover:text-white rounded text-xs font-semibold transition-colors cursor-pointer touch-manipulation';
        const artist = track.artist ? `<span class="opacity-60 text-[10px] ml-1">(${track.artist})</span>` : '';
        row.innerHTML = `<div class="flex items-center gap-2 truncate flex-1 min-w-0"><i class="fas fa-music text-acid-pink group-hover:text-white text-sm shrink-0"></i><span class="truncate">${track.title}</span>${artist}</div><button class="p-1 px-2 text-white bg-black/40 hover:bg-black/80 rounded add-btn shrink-0" title="Aggiungi"><i class="fas fa-plus text-[10px]"></i></button>`;
        row.onclick = () => { pl.setPlaylists(tracks); renderUICb(); loadTrackCb(idx, true); };
        row.querySelector('.add-btn').onclick = (e) => { e.stopPropagation(); pl.currentPlaylist.push(track); renderUICb(); };
        container.appendChild(row);
    });
}

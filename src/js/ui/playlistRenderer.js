import { formatTime } from '../utils/helpers.js';

export function updatePlaylistView(playlist, currentIndex, isPlaying, elements, actions) {
    const { playlistEl, nextBtn, prevBtn, shuffleBtn } = elements;
    if (!playlistEl) return;
    playlistEl.innerHTML = '';

    playlist.forEach((track, index) => {
        const isCurrent = index === currentIndex;
        const li = document.createElement('li');

        li.className = `playlist-item flex justify-between items-center p-3 rounded-lg shadow-sm mb-2 transition-all duration-200 cursor-pointer ${isCurrent ? 'active scale-[1.02]' : ''}`;

        const infoDiv = document.createElement('div');
        infoDiv.className = 'flex-1 truncate mr-2 cursor-pointer';
        infoDiv.innerHTML = `
            <span class="font-bold opacity-50 mr-2">${index + 1}.</span>
            <span class="font-semibold">${track.title}</span> 
            ${track.artist && track.artist !== 'Locale' ? `<span class="text-[10px] uppercase opacity-70 ml-1">- ${track.artist}</span>` : ''}
        `;
        infoDiv.onclick = () => actions.onLoadTrack(index);

        const btnGroup = document.createElement('div');
        btnGroup.className = 'flex items-center space-x-4';

        const addBtn = document.createElement('button');
        addBtn.innerHTML = '<i class="fas fa-plus-circle fa-lg pointer-events-none"></i>';
        addBtn.className = `transition-transform hover:scale-125 p-1 ${isCurrent ? 'opacity-80 hover:opacity-100' : 'opacity-50 hover:opacity-100 text-theme-accent'}`;
        addBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            actions.onAddToPlaylist(track.id);
        };

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="fas fa-times pointer-events-none"></i>';
        removeBtn.className = `transition-colors p-1 opacity-50 hover:opacity-100 hover:text-red-500`;
        removeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            actions.onRemoveTrack(index);
        };

        btnGroup.appendChild(addBtn);
        btnGroup.appendChild(removeBtn);
        li.appendChild(infoDiv);
        li.appendChild(btnGroup);
        playlistEl.appendChild(li);

        // COMMENTATO: Preveniamo che lo scorrimento automatico della traccia a inizio playback forzi il salto dello schermo.
        // if (isCurrent && isPlaying) {
        //     li.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // }
    });

    if (nextBtn) nextBtn.disabled = playlist.length === 0;
    if (prevBtn) prevBtn.disabled = playlist.length === 0;

    if (shuffleBtn) {
        if (actions.isShuffling) {
            shuffleBtn.classList.add('text-theme-accent', 'scale-110');
            shuffleBtn.classList.remove('opacity-70');
        } else {
            shuffleBtn.classList.remove('text-theme-accent', 'scale-110');
            shuffleBtn.classList.add('opacity-70');
        }
    }
}

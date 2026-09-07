// data/playlist.js - Gestione della coda di riproduzione, shuffle e salvataggio locale
import * as stateManager from '../core/stateManager.js';

export let currentPlaylist = [];
export let originalPlaylistOrder = [];
export let currentTrackIndex = 0;
export let isPlaying = false;
export let isShuffling = false;
export let currentCoverUrl = null;

export function setPlaylists(tracks) {
    currentPlaylist = [...tracks];
    originalPlaylistOrder = [...tracks];
}

export function updatePlaylistFromFilter(tracks) {
    currentPlaylist = [...tracks];
}

function getSecureRandomDouble() {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
}

export function toggleShuffle() {
    isShuffling = !isShuffling;
    if (isShuffling) {
        for (let i = currentPlaylist.length - 1; i > 0; i--) {
            const j = Math.floor(getSecureRandomDouble() * (i + 1));
            [currentPlaylist[i], currentPlaylist[j]] = [currentPlaylist[j], currentPlaylist[i]];
        }
    } else {
        currentPlaylist = [...originalPlaylistOrder];
    }
    return isShuffling;
}

export function getNextTrackIndex() {
    if (currentPlaylist.length === 0) return 0;
    return (currentTrackIndex + 1) % currentPlaylist.length;
}

export function getPrevTrackIndex() {
    if (currentPlaylist.length === 0) return 0;
    return (currentTrackIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
}

export function removeTrack(index) {
    currentPlaylist.splice(index, 1);
}

export function setCurrentTrackIndex(index) {
    if (currentPlaylist.length === 0) return;
    currentTrackIndex = (index + currentPlaylist.length) % currentPlaylist.length;
}

export function getCurrentTrack() {
    if (currentPlaylist.length === 0) return null;
    return currentPlaylist[currentTrackIndex];
}

export function setPlaying(playing) { isPlaying = playing; }
export function setCoverUrl(url) { currentCoverUrl = url; }

// Salvataggio 100% Locale e Nativo delle Playlist
export async function getSavedPlaylists() {
    return stateManager.getSavedPlaylists();
}

export async function savePlaylistToServer(name, tracks) {
    return await stateManager.savePlaylist(name, tracks);
}

export async function deleteSavedPlaylist(name) {
    return await stateManager.deletePlaylist(name);
}

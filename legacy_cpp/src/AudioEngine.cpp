#include "AudioEngine.h"
#include <filesystem>
#include <iostream>

namespace fs = std::filesystem;

AudioEngine::AudioEngine()
    : currentMusic{}, flacStream{}, isFlacTrack(false), isAudioDeviceReady(false),
      isMusicLoaded(false), isPaused(false), currentVolume(0.8f),
      currentFilePath(""), currentTitle("Nessun brano caricato") {}

AudioEngine::~AudioEngine() { Shutdown(); }

bool AudioEngine::Initialize() {
    if (!isAudioDeviceReady) {
        InitAudioDevice();
        isAudioDeviceReady = IsAudioDeviceReady();
        if (isAudioDeviceReady) {
            std::cout << "[AudioEngine] Dispositivo audio inizializzato.\n";
        }
    }
    return isAudioDeviceReady;
}

void AudioEngine::Shutdown() {
    UnloadTrack();
    if (isAudioDeviceReady) {
        CloseAudioDevice();
        isAudioDeviceReady = false;
    }
}

bool AudioEngine::LoadTrack(const std::string& filePath) {
    if (!isAudioDeviceReady && !Initialize()) return false;
    if (!fs::exists(filePath) || fs::is_directory(filePath)) return false;

    UnloadTrack();
    std::string ext = fs::path(filePath).extension().string();
    for (auto& c : ext) c = tolower(c);

    if (ext == ".flac") {
        if (!flacStream.Open(filePath)) return false;
        flacStream.SetVolume(currentVolume);
        isFlacTrack = true;
    } else {
        currentMusic = LoadMusicStream(filePath.c_str());
        if (currentMusic.ctxData == nullptr) return false;
        currentMusic.looping = false; // L'avanzamento al brano successivo è gestito dalla Playlist
        PlayMusicStream(currentMusic);
        SetMusicVolume(currentMusic, currentVolume);
        isFlacTrack = false;
    }

    isMusicLoaded = true;
    isPaused = false;
    currentFilePath = filePath;
    currentTitle = fs::path(filePath).stem().string();
    std::cout << "[AudioEngine] In riproduzione: " << currentTitle << "\n";
    return true;
}

void AudioEngine::UnloadTrack() {
    if (isMusicLoaded) {
        if (isFlacTrack) flacStream.Close();
        else { StopMusicStream(currentMusic); UnloadMusicStream(currentMusic); }
        isFlacTrack = false;
        isMusicLoaded = false;
        isPaused = false;
        currentFilePath = "";
        currentTitle = "Nessun brano caricato";
    }
}

void AudioEngine::Play() {
    if (isMusicLoaded && isPaused) {
        if (isFlacTrack) flacStream.Play(); else ResumeMusicStream(currentMusic);
        isPaused = false;
    }
}

void AudioEngine::Pause() {
    if (isMusicLoaded && !isPaused) {
        if (isFlacTrack) flacStream.Pause(); else PauseMusicStream(currentMusic);
        isPaused = true;
    }
}

void AudioEngine::TogglePlayPause() {
    if (isPaused) Play(); else Pause();
}

void AudioEngine::Stop() {
    if (isMusicLoaded) {
        if (isFlacTrack) flacStream.Stop(); else StopMusicStream(currentMusic);
        isPaused = true;
    }
}

void AudioEngine::Update() {
    if (isMusicLoaded && !isFlacTrack) {
        UpdateMusicStream(currentMusic);
    }
}

void AudioEngine::Seek(float seconds) {
    if (isMusicLoaded) {
        if (isFlacTrack) flacStream.Seek(seconds);
        else SeekMusicStream(currentMusic, seconds);
    }
}

void AudioEngine::SetVolume(float volume) {
    currentVolume = (volume < 0.0f) ? 0.0f : (volume > 1.0f ? 1.0f : volume);
    if (isMusicLoaded) {
        if (isFlacTrack) flacStream.SetVolume(currentVolume);
        else SetMusicVolume(currentMusic, currentVolume);
    }
}

float AudioEngine::GetTimePlayed() const {
    if (!isMusicLoaded) return 0.0f;
    return isFlacTrack ? flacStream.GetTimePlayed() : GetMusicTimePlayed(currentMusic);
}

float AudioEngine::GetTimeLength() const {
    if (!isMusicLoaded) return 0.0f;
    return isFlacTrack ? flacStream.GetTimeLength() : GetMusicTimeLength(currentMusic);
}

bool AudioEngine::IsPlaying() const {
    if (!isMusicLoaded || isPaused) return false;
    return isFlacTrack ? flacStream.IsPlaying() : IsMusicStreamPlaying(currentMusic);
}

bool AudioEngine::HasTrackFinished() const {
    if (!isMusicLoaded || isPaused) return false;
    float len = GetTimeLength();
    return (len > 0.0f && GetTimePlayed() >= len - 0.2f);
}

#ifndef AUDIO_ENGINE_H
#define AUDIO_ENGINE_H

#include "raylib.h"
#include "FlacStream.h"
#include <string>

/**
 * @file AudioEngine.h
 * @brief Motore di riproduzione audio nativo basato su Raylib e FlacStream.
 * 
 * Gestisce lo streaming continuo di MP3, WAV, OGG (tramite Raylib Music)
 * e FLAC (tramite il modulo nativo FlacStream / dr_flac).
 */
class AudioEngine {
public:
    AudioEngine();
    ~AudioEngine();

    bool Initialize();
    void Shutdown();

    bool LoadTrack(const std::string& filePath);
    void UnloadTrack();

    void Play();
    void Pause();
    void TogglePlayPause();
    void Stop();
    void Update();

    void Seek(float positionSeconds);
    void SetVolume(float volume);
    float GetVolume() const { return currentVolume; }

    float GetTimePlayed() const;
    float GetTimeLength() const;

    bool IsPlaying() const;
    bool HasTrackFinished() const;
    bool IsLoaded() const { return isMusicLoaded; }
    const std::string& GetCurrentTitle() const { return currentTitle; }
    const std::string& GetCurrentFilePath() const { return currentFilePath; }

private:
    Music currentMusic;         // Struttura streaming Raylib per MP3/WAV/OGG
    FlacStream flacStream;      // Modulo dedicato streaming FLAC lossless
    bool isFlacTrack;           // Flag: traccia corrente è in formato FLAC
    bool isAudioDeviceReady;    // Flag stato scheda audio
    bool isMusicLoaded;         // Flag presenza traccia attiva
    bool isPaused;              // Flag stato di pausa
    float currentVolume;        // Livello volume corrente (0.0 - 1.0)
    std::string currentFilePath;// Percorso assoluto del file
    std::string currentTitle;   // Nome estratto del brano
};

#endif // AUDIO_ENGINE_H

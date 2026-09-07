#ifndef PLAYER_UI_H
#define PLAYER_UI_H

#include "raylib.h"
#include "SeekBar.h"
#include "VisualizerUI.h"
#include <string>

class AudioEngine;

/**
 * @file PlayerUI.h
 * @brief Interfaccia utente moderna stile WebMusicPlayerAI (Django).
 */
class PlayerUI {
public:
    PlayerUI();
    void Update(float dt);
    void Draw(AudioEngine& audio, int screenWidth, int screenHeight);
    void ShowNotification(const std::string& msg, Color col);

    bool WasDemoRequested() const { return demoRequested; }
    void ResetDemoRequest() { demoRequested = false; }
    bool WasNextRequested() const { return nextRequested; }
    bool WasPrevRequested() const { return prevRequested; }
    void ResetNavRequests() { nextRequested = false; prevRequested = false; }
    bool WasThemeToggleRequested() const { return themeToggleRequested; }
    void ResetThemeToggleRequest() { themeToggleRequested = false; }

    VisualizerUI& GetVisualizer() { return visualizer; }

private:
    SeekBar seekBar;
    VisualizerUI visualizer;
    std::string notificationMessage;
    Color notificationColor;
    float notificationTimer;
    bool demoRequested;
    bool nextRequested;
    bool prevRequested;
    bool themeToggleRequested;
    bool isVolumeDragging;

    bool DrawButton(Rectangle rec, const char* text, Color bg, Color hov, Color fg, Vector2 mouse, float fontSize, bool* hovered);
    bool DrawCircleButton(Vector2 center, float radius, const char* icon, Color bg, Color hov, Color fg, Vector2 mouse, bool* hovered);
    void DrawVolumeSlider(AudioEngine& audio, Rectangle rec, Vector2 mouse, bool* hovered);
};

#endif // PLAYER_UI_H

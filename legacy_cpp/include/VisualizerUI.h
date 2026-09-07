#ifndef VISUALIZER_UI_H
#define VISUALIZER_UI_H

#include "raylib.h"

/**
 * @enum VisualizerType
 * @brief Tipi di animazione visiva nel display centrale (ispirati a WebMusicPlayerAI).
 */
enum class VisualizerType {
    BARS,       // Spettro a barre verticali
    WAVEFORM,   // Onda oscilloscopica continua
    CIRCLES,    // Cerchi concentrici reattivi
    VINYL       // Disco in vinile con rotazione
};

/**
 * @file VisualizerUI.h
 * @brief Componente grafico per il visualizzatore audio reattivo a 60 FPS.
 */
class VisualizerUI {
public:
    VisualizerUI();
    void Update(float dt);
    void NextType();
    const char* GetTypeName() const;
    void Draw(Rectangle bounds, bool isPlaying);

private:
    VisualizerType type;
    float animTime;
    float vinylRotation;
    float barHeights[32];

    void DrawBars(Rectangle bounds, bool isPlaying);
    void DrawWaveform(Rectangle bounds, bool isPlaying);
    void DrawCircles(Rectangle bounds, bool isPlaying);
    void DrawVinyl(Rectangle bounds, bool isPlaying);
};

#endif // VISUALIZER_UI_H

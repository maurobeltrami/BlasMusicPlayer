#ifndef THEME_H
#define THEME_H

#include "raylib.h"
#include <string>

/**
 * @enum ThemeMode
 * @brief Modalità estetica dell'applicazione: Modern Dark (Spotify) o Punk Acid.
 */
enum class ThemeMode {
    MODERN_DARK,
    PUNK
};

/**
 * @file Theme.h
 * @brief Gestore centralizzato dei temi e della tipografia vettoriale TrueType.
 */
namespace Theme {
    // Tavolozza attiva dinamica
    extern Color BgMain;
    extern Color CardBg;
    extern Color CardHover;
    extern Color BorderColor;
    extern Color AccentPrimary;
    extern Color AccentHover;
    extern Color TextMain;
    extern Color TextMuted;
    extern Color TextDim;
    extern Color SliderTrack;
    extern Color AcidPink;
    extern Color AcidBlue;

    // Dimensioni Finestra
    constexpr int WindowWidth  = 1000;
    constexpr int WindowHeight = 660;

    // Inizializzazione e gestione font vettoriale
    void Init(const char* fontPath);
    void Unload();
    Font GetFont();

    // Funzioni helper per disegno e misurazione testo con font vettoriale
    void DrawText(const char* text, float x, float y, float fontSize, Color color);
    int MeasureText(const char* text, float fontSize);

    // Gestione modalità tema
    void SetMode(ThemeMode mode);
    void ToggleMode();
    ThemeMode GetMode();
    const char* GetModeName();
}

#endif // THEME_H

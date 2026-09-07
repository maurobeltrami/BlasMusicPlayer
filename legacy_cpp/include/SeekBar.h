#ifndef SEEK_BAR_H
#define SEEK_BAR_H

#include "raylib.h"
#include <string>

class AudioEngine;

/**
 * @file SeekBar.h
 * @brief Componente grafico per la barra di avanzamento temporale e scrubbing con mouse.
 * 
 * Gestisce il calcolo del tempo, la formattazione MM:SS e l'interazione al click
 * o trascinamento continuo del cursore lungo la barra di riproduzione.
 */
class SeekBar {
public:
    SeekBar();

    // Disegna la barra di avanzamento e gestisce click e trascinamento (Scrubbing)
    void Draw(AudioEngine& audio, Rectangle bounds, Vector2 mousePos, bool* anyHovered = nullptr);

    // Converte un valore in secondi nel formato testuale "MM:SS"
    static std::string FormatTime(float seconds);

private:
    bool isScrubbing;       // Flag: l'utente sta trascinando la maniglia con il mouse
    float scrubTargetTime;  // Tempo visualizzato durante il trascinamento
};

#endif // SEEK_BAR_H

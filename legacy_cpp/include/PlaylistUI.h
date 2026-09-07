#ifndef PLAYLIST_UI_H
#define PLAYLIST_UI_H

#include "raylib.h"

class Playlist;

/**
 * @file PlaylistUI.h
 * @brief Componente grafico per il pannello laterale della Playlist con scroll.
 * 
 * Disegna la lista dei brani in coda, evidenzia la traccia attiva, gestisce
 * lo scorrimento tramite rotellina del mouse e rileva la selezione di un brano.
 */
class PlaylistUI {
public:
    PlaylistUI();

    // Disegna il pannello laterale e restituisce l'indice del brano cliccato (-1 se nessuno)
    int Draw(const Playlist& playlist, Rectangle bounds, Vector2 mousePos, bool* anyHovered = nullptr);

private:
    float scrollY; // Offset di scorrimento verticale
};

#endif // PLAYLIST_UI_H

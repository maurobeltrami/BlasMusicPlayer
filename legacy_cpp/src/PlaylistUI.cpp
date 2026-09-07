#include "PlaylistUI.h"
#include "Playlist.h"
#include "Theme.h"
#include <algorithm>

PlaylistUI::PlaylistUI() : scrollY(0.0f) {}

int PlaylistUI::Draw(const Playlist& playlist, Rectangle bounds, Vector2 mousePos, bool* anyHovered) {
    int clickedIndex = -1;
    bool isMouseOver = CheckCollisionPointRec(mousePos, bounds);
    if (isMouseOver && anyHovered) *anyHovered = true;

    // Sfondo e linea laterale
    DrawRectangleRec(bounds, Theme::CardBg);
    DrawLine((int)(bounds.x + bounds.width), (int)bounds.y, (int)(bounds.x + bounds.width), (int)(bounds.y + bounds.height), Theme::BorderColor);

    // Intestazione con badge e contatore
    DrawRectangle((int)bounds.x, (int)bounds.y, (int)bounds.width, 40, Theme::CardBg);
    DrawLine((int)bounds.x, (int)(bounds.y + 40), (int)(bounds.x + bounds.width), (int)(bounds.y + 40), Theme::BorderColor);
    std::string header = "CODA BRANI (" + std::to_string(playlist.GetCount()) + ")";
    Theme::DrawText(header.c_str(), bounds.x + 16, bounds.y + 12, 13, Theme::AccentPrimary);

    const auto& tracks = playlist.GetTracks();
    if (tracks.empty()) {
        Theme::DrawText("Nessun brano in coda.", bounds.x + 16, bounds.y + 60, 13, Theme::TextDim);
        Theme::DrawText("Trascina file o cartelle!", bounds.x + 16, bounds.y + 80, 12, Theme::TextMuted);
        return -1;
    }

    float itemHeight = 36.0f, contentHeight = tracks.size() * itemHeight, visibleHeight = bounds.height - 40.0f;
    if (isMouseOver && contentHeight > visibleHeight) {
        scrollY = std::clamp(scrollY + GetMouseWheelMove() * 28.0f, visibleHeight - contentHeight, 0.0f);
    } else if (contentHeight <= visibleHeight) scrollY = 0.0f;

    BeginScissorMode((int)bounds.x, (int)(bounds.y + 41), (int)bounds.width, (int)(bounds.height - 41));
    for (size_t i = 0; i < tracks.size(); i++) {
        float itemY = bounds.y + 45.0f + (i * itemHeight) + scrollY;
        if (itemY + itemHeight < bounds.y + 40 || itemY > bounds.y + bounds.height) continue;

        Rectangle itemRec = { bounds.x + 6, itemY, bounds.width - 12, itemHeight - 2 };
        bool itemHover = CheckCollisionPointRec(mousePos, itemRec) && isMouseOver;
        if (itemHover && anyHovered) *anyHovered = true;

        bool isCurrent = (static_cast<int>(i) == playlist.GetCurrentIndex());
        if (isCurrent || itemHover) {
            DrawRectangleRounded(itemRec, 0.2f, 4, Theme::CardHover);
            if (isCurrent) DrawRectangle((int)itemRec.x + 2, (int)itemRec.y + 4, 3, (int)itemRec.height - 8, Theme::AccentPrimary);
        }

        std::string num = std::to_string(i + 1) + ".";
        Theme::DrawText(num.c_str(), itemRec.x + 12, itemRec.y + 10, 12, isCurrent ? Theme::AccentPrimary : Theme::TextDim);

        std::string title = tracks[i].title;
        if (title.length() > 24) title = title.substr(0, 22) + "..";
        Theme::DrawText(title.c_str(), itemRec.x + 36, itemRec.y + 10, 12, isCurrent ? Theme::TextMain : Theme::TextMuted);

        if (itemHover && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) clickedIndex = static_cast<int>(i);
    }
    EndScissorMode();
    return clickedIndex;
}

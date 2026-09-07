#include "FileBrowser.h"
#include "Theme.h"
#include <filesystem>
#include <algorithm>
#include <cstdio>
#include <cstdlib>

namespace fs = std::filesystem;

static std::string RunAppleScript(const char* script) {
    FILE* fp = popen(script, "r");
    if (!fp) return "";
    char buf[1024];
    std::string res = (std::fgets(buf, sizeof(buf), fp)) ? buf : "";
    while (!res.empty() && (res.back() == '\n' || res.back() == '\r')) res.pop_back();
    pclose(fp);
    return res;
}

FileBrowser::FileBrowser() : scrollY(0.0f), folderQueueRequested(false) {
    const char* home = std::getenv("HOME");
    std::string startPath = home ? (std::string(home) + "/Music") : fs::current_path().string();
    if (!fs::exists(startPath)) startPath = home ? home : fs::current_path().string();
    NavigateTo(startPath);
}

bool FileBrowser::IsAudioFile(const std::string& ext) {
    std::string lower = ext;
    for (auto& c : lower) c = tolower(c);
    return (lower == ".mp3" || lower == ".wav" || lower == ".flac" || lower == ".ogg");
}

void FileBrowser::ScanCurrentDirectory() {
    items.clear();
    std::error_code ec;
    fs::path cur(currentPath);

    if (cur.has_parent_path() && cur.parent_path() != cur) {
        items.push_back({ ".. (Cartella superiore)", cur.parent_path().string(), true });
    }

    std::vector<FileItem> dirs, files;
    for (const auto& entry : fs::directory_iterator(cur, ec)) {
        if (ec) break;
        std::string fn = entry.path().filename().string();
        if (!fn.empty() && fn[0] == '.') continue;

        if (entry.is_directory(ec)) dirs.push_back({ fn, entry.path().string(), true });
        else if (entry.is_regular_file(ec) && IsAudioFile(entry.path().extension().string())) {
            files.push_back({ fn, entry.path().string(), false });
        }
    }

    auto comp = [](const FileItem& a, const FileItem& b) { return a.name < b.name; };
    std::sort(dirs.begin(), dirs.end(), comp); std::sort(files.begin(), files.end(), comp);
    items.insert(items.end(), dirs.begin(), dirs.end());
    items.insert(items.end(), files.begin(), files.end());
    scrollY = 0.0f;
}

bool FileBrowser::NavigateTo(const std::string& dirPath) {
    std::error_code ec;
    if (!fs::exists(dirPath, ec) || !fs::is_directory(dirPath, ec)) return false;
    currentPath = fs::canonical(dirPath, ec).string();
    ScanCurrentDirectory();
    return true;
}

bool FileBrowser::GoUp() {
    fs::path cur(currentPath);
    return cur.has_parent_path() ? NavigateTo(cur.parent_path().string()) : false;
}
std::string FileBrowser::OpenNativeFolderDialog() {
    return RunAppleScript("osascript -e 'POSIX path of (choose folder with prompt \"Seleziona cartella musica:\")' 2>/dev/null");
}
std::string FileBrowser::OpenNativeFileDialog() {
    return RunAppleScript("osascript -e 'POSIX path of (choose file of type {\"mp3\", \"wav\", \"flac\", \"ogg\"} with prompt \"Seleziona brano:\")' 2>/dev/null");
}

static bool DrawMiniBtn(Rectangle r, const char* t, Vector2 m, bool* h, Color bg, Color hov, Color fg = Theme::TextMain) {
    bool isH = CheckCollisionPointRec(m, r);
    if (isH && h) *h = true;
    DrawRectangleRounded(r, 0.3f, 4, isH ? hov : bg);
    int tw = Theme::MeasureText(t, 11);
    Theme::DrawText(t, r.x + r.width/2 - tw/2, r.y + 4, 11, fg);
    return isH && IsMouseButtonPressed(MOUSE_BUTTON_LEFT);
}

std::string FileBrowser::Draw(Rectangle bounds, Vector2 mouse, bool* anyHover) {
    std::string selectedFile = "";
    bool isOver = CheckCollisionPointRec(mouse, bounds);
    if (isOver && anyHover) *anyHover = true;

    DrawRectangleRec(bounds, Theme::CardBg);
    DrawLine((int)(bounds.x + bounds.width), (int)bounds.y, (int)(bounds.x + bounds.width), (int)(bounds.y + bounds.height), Theme::BorderColor);

    // Barra comandi con percorso e pulsanti
    DrawRectangle((int)bounds.x, (int)bounds.y, (int)bounds.width, 68, Theme::CardBg);
    DrawLine((int)bounds.x, (int)(bounds.y + 68), (int)(bounds.x + bounds.width), (int)(bounds.y + 68), Theme::BorderColor);

    std::string pName = fs::path(currentPath).filename().string();
    Theme::DrawText(("📁 " + (pName.empty() ? currentPath : pName)).c_str(), bounds.x + 12, bounds.y + 10, 13, Theme::AccentPrimary);

    if (DrawMiniBtn({ bounds.x + 10, bounds.y + 34, 48, 22 }, "⬆ Su", mouse, anyHover, Theme::BgMain, Theme::CardHover)) GoUp();

    if (DrawMiniBtn({ bounds.x + 64, bounds.y + 34, 76, 22 }, "📂 Sfoglia", mouse, anyHover, Theme::BgMain, Theme::CardHover)) {
        std::string chosen = OpenNativeFolderDialog();
        if (!chosen.empty()) { NavigateTo(chosen); folderQueueRequested = true; }
    }

    if (DrawMiniBtn({ bounds.x + 146, bounds.y + 34, 118, 22 }, "➕ Accoda", mouse, anyHover, Theme::AccentPrimary, Theme::AccentHover, Theme::BgMain)) {
        folderQueueRequested = true;
    }

    float itemH = 30.0f, totalH = items.size() * itemH, viewH = bounds.height - 70.0f;
    if (isOver && totalH > viewH) {
        scrollY = std::clamp(scrollY + GetMouseWheelMove() * 26.0f, viewH - totalH, 0.0f);
    } else if (totalH <= viewH) scrollY = 0.0f;

    BeginScissorMode((int)bounds.x, (int)(bounds.y + 69), (int)bounds.width, (int)(bounds.height - 69));
    for (size_t i = 0; i < items.size(); i++) {
        float rowY = bounds.y + 72.0f + (i * itemH) + scrollY;
        if (rowY + itemH < bounds.y + 68 || rowY > bounds.y + bounds.height) continue;

        Rectangle row = { bounds.x + 6, rowY, bounds.width - 12, itemH - 2 };
        bool rHover = CheckCollisionPointRec(mouse, row) && isOver;
        if (rHover && anyHover) *anyHover = true;
        if (rHover) DrawRectangleRounded(row, 0.2f, 4, Theme::CardHover);

        const char* icon = items[i].isDirectory ? "📁 " : "🎵 ";
        Color txtCol = items[i].isDirectory ? Theme::AccentPrimary : Theme::TextMain;
        std::string label = icon + items[i].name;
        if (label.length() > 26) label = label.substr(0, 24) + "..";
        Theme::DrawText(label.c_str(), row.x + 8, row.y + 7, 12, txtCol);

        if (rHover && IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
            if (items[i].isDirectory) NavigateTo(items[i].fullPath);
            else selectedFile = items[i].fullPath;
        }
    }
    EndScissorMode();
    return selectedFile;
}

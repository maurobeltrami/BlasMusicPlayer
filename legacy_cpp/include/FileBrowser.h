#ifndef FILE_BROWSER_H
#define FILE_BROWSER_H

#include "raylib.h"
#include <string>
#include <vector>

/**
 * @struct FileItem
 * @brief Rappresenta una cartella o un file musicale nel browser.
 */
struct FileItem {
    std::string name;
    std::string fullPath;
    bool isDirectory;
};

/**
 * @file FileBrowser.h
 * @brief Esploratore grafico di file e cartelle integrato nell'applicazione.
 * 
 * Permette di navigare nel disco rigido, salire di livello, accedere a cartelle musicali
 * e invocare la finestra di selezione nativa del sistema operativo.
 */
class FileBrowser {
public:
    FileBrowser();

    bool NavigateTo(const std::string& directoryPath);
    bool GoUp();
    void Refresh() { ScanCurrentDirectory(); }

    std::string OpenNativeFileDialog();
    std::string OpenNativeFolderDialog();

    // Disegna l'interfaccia. Restituisce il percorso se un file è stato cliccato per la riproduzione
    std::string Draw(Rectangle bounds, Vector2 mousePos, bool* anyHovered = nullptr);

    const std::string& GetCurrentPath() const { return currentPath; }
    bool WasFolderQueueRequested() const { return folderQueueRequested; }
    void ResetFolderQueueRequest() { folderQueueRequested = false; }

private:
    std::string currentPath;
    std::vector<FileItem> items;
    float scrollY;
    bool folderQueueRequested;

    void ScanCurrentDirectory();
    static bool IsAudioFile(const std::string& ext);
};

#endif // FILE_BROWSER_H

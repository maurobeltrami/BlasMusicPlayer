package org.blasopen.musicplayer

import android.net.Uri
import android.os.Bundle
import android.support.v4.media.MediaBrowserCompat.MediaItem
import android.support.v4.media.MediaDescriptionCompat
import androidx.media.MediaBrowserServiceCompat.Result
import java.io.File

/**
 * Gestore del catalogo navigabile per lo schermo touch di Android Auto.
 * Espone cartelle locali e brani come MediaItem navigabili e riproducibili.
 */
object MediaCatalogHelper {
  const val MEDIA_ROOT_ID = "blas_root_id"
  private const val CAT_MUSIC = "cat_music"
  private const val CAT_DOWNLOADS = "cat_downloads"

  fun getRoot(clientPackageName: String): String = MEDIA_ROOT_ID

  fun loadChildren(parentId: String, result: Result<List<MediaItem>>) {
    val items = mutableListOf<MediaItem>()

    when (parentId) {
      MEDIA_ROOT_ID -> {
        // Categorie principali visibili sull'interfaccia dell'auto
        items.add(createCategory(CAT_MUSIC, "Musica", "Cartella /storage/emulated/0/Music"))
        items.add(createCategory(CAT_DOWNLOADS, "Download", "Cartella /storage/emulated/0/Download"))
        result.sendResult(items)
      }
      CAT_MUSIC -> {
        loadFolderAudio("/storage/emulated/0/Music", items)
        result.sendResult(items)
      }
      CAT_DOWNLOADS -> {
        loadFolderAudio("/storage/emulated/0/Download", items)
        result.sendResult(items)
      }
      else -> {
        result.sendResult(emptyList())
      }
    }
  }

  private fun createCategory(id: String, title: String, subtitle: String): MediaItem {
    val desc = MediaDescriptionCompat.Builder()
      .setMediaId(id)
      .setTitle(title)
      .setSubtitle(subtitle)
      .build()
    return MediaItem(desc, MediaItem.FLAG_BROWSABLE)
  }

  private fun loadFolderAudio(folderPath: String, outItems: MutableList<MediaItem>) {
    val dir = File(folderPath)
    if (!dir.exists() || !dir.isDirectory) return

    val validExts = setOf("mp3", "flac", "ogg", "wav", "m4a", "aac")
    val files = dir.listFiles { f ->
      f.isFile && validExts.contains(f.extension.lowercase())
    } ?: return

    files.sortedBy { it.name.lowercase() }.forEach { file ->
      val title = file.nameWithoutExtension
      val desc = MediaDescriptionCompat.Builder()
        .setMediaId(file.absolutePath)
        .setTitle(title)
        .setSubtitle("File locale")
        .setMediaUri(Uri.fromFile(file))
        .build()

      outItems.add(MediaItem(desc, MediaItem.FLAG_PLAYABLE))
    }
  }
}

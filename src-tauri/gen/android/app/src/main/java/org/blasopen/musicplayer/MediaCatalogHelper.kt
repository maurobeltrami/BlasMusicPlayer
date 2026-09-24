package org.blasopen.musicplayer

import android.net.Uri
import android.support.v4.media.MediaBrowserCompat.MediaItem
import android.support.v4.media.MediaDescriptionCompat
import androidx.media.MediaBrowserServiceCompat.Result
import java.io.File

/**
 * Gestore del catalogo navigabile per lo schermo touch di Android Auto.
 * Espone cartelle, artisti e album come MediaItem navigabili e riproducibili.
 */
object MediaCatalogHelper {
  const val MEDIA_ROOT_ID = "blas_root_id"
  private const val CAT_FOLDERS = "cat_folders"
  private const val CAT_ARTISTS = "cat_artists"
  private const val CAT_ALBUMS = "cat_albums"

  fun loadChildren(parentId: String, result: Result<List<MediaItem>>) {
    val items = mutableListOf<MediaItem>()
    val allAudio = getAllLocalAudioFiles()

    when {
      parentId == MEDIA_ROOT_ID -> {
        items.add(createCategory(CAT_FOLDERS, "📁 Cartelle", "Naviga per cartelle di sistema"))
        items.add(createCategory(CAT_ARTISTS, "🎤 Artisti", "Brani raggruppati per artista"))
        items.add(createCategory(CAT_ALBUMS, "💿 Album", "Brani raggruppati per album"))
        result.sendResult(items)
      }
      parentId == CAT_FOLDERS -> {
        items.add(createCategory("cat_music", "Musica", "/storage/emulated/0/Music"))
        items.add(createCategory("cat_downloads", "Download", "/storage/emulated/0/Download"))
        result.sendResult(items)
      }
      parentId == "cat_music" -> {
        loadFolderAudio("/storage/emulated/0/Music", items)
        result.sendResult(items)
      }
      parentId == "cat_downloads" -> {
        loadFolderAudio("/storage/emulated/0/Download", items)
        result.sendResult(items)
      }
      parentId == CAT_ARTISTS -> {
        val artists = allAudio.groupBy { parseArtist(it.nameWithoutExtension) }
        artists.keys.sorted().forEach { art ->
          val count = artists[art]?.size ?: 0
          items.add(createCategory("art_$art", art, "$count brani"))
        }
        result.sendResult(items)
      }
      parentId.startsWith("art_") -> {
        val targetArtist = parentId.removePrefix("art_")
        allAudio.filter { parseArtist(it.nameWithoutExtension) == targetArtist }.forEach { f ->
          items.add(createPlayableItem(f))
        }
        result.sendResult(items)
      }
      parentId == CAT_ALBUMS -> {
        val albums = allAudio.groupBy { f -> f.parentFile?.name ?: "Singoli" }
        albums.keys.sorted().forEach { alb ->
          val count = albums[alb]?.size ?: 0
          items.add(createCategory("alb_$alb", alb, "$count brani"))
        }
        result.sendResult(items)
      }
      parentId.startsWith("alb_") -> {
        val targetAlbum = parentId.removePrefix("alb_")
        allAudio.filter { (it.parentFile?.name ?: "Singoli") == targetAlbum }.forEach { f ->
          items.add(createPlayableItem(f))
        }
        result.sendResult(items)
      }
      else -> result.sendResult(emptyList())
    }
  }

  private fun createCategory(id: String, title: String, subtitle: String): MediaItem {
    val desc = MediaDescriptionCompat.Builder().setMediaId(id).setTitle(title).setSubtitle(subtitle).build()
    return MediaItem(desc, MediaItem.FLAG_BROWSABLE)
  }

  private fun createPlayableItem(file: File): MediaItem {
    val desc = MediaDescriptionCompat.Builder()
      .setMediaId(file.absolutePath)
      .setTitle(file.nameWithoutExtension)
      .setSubtitle(parseArtist(file.nameWithoutExtension))
      .setMediaUri(Uri.fromFile(file))
      .build()
    return MediaItem(desc, MediaItem.FLAG_PLAYABLE)
  }

  private fun parseArtist(stem: String): String {
    val parts = stem.split(" - ")
    return if (parts.size >= 2) parts[0].trim() else "Varie"
  }

  private fun getAllLocalAudioFiles(): List<File> {
    val list = mutableListOf<File>()
    loadFolderAudio("/storage/emulated/0/Music", mutableListOf(), list)
    loadFolderAudio("/storage/emulated/0/Download", mutableListOf(), list)
    return list
  }

  private fun loadFolderAudio(path: String, outItems: MutableList<MediaItem>, outFiles: MutableList<File>? = null) {
    val dir = File(path)
    if (!dir.exists() || !dir.isDirectory) return
    val exts = setOf("mp3", "flac", "ogg", "wav", "m4a", "aac")
    dir.listFiles { f -> f.isFile && exts.contains(f.extension.lowercase()) }?.sortedBy { it.name.lowercase() }?.forEach { f ->
      outItems.add(createPlayableItem(f))
      outFiles?.add(f)
    }
  }
}

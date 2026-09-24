package org.blasopen.musicplayer

import android.net.Uri
import android.support.v4.media.MediaBrowserCompat.MediaItem
import android.support.v4.media.MediaDescriptionCompat
import androidx.media.MediaBrowserServiceCompat.Result
import java.io.File

/**
 * Gestore del catalogo navigabile per lo schermo touch di Android Auto.
 * Espone cartelle ricorsive, artisti e album per il cruscotto.
 */
object MediaCatalogHelper {
  const val MEDIA_ROOT_ID = "blas_root_id"
  private const val CAT_FOLDERS = "cat_folders"
  private const val CAT_ARTISTS = "cat_artists"
  private const val CAT_ALBUMS = "cat_albums"
  private val AUDIO_EXTS = setOf("mp3", "flac", "ogg", "wav", "m4a", "aac")

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
        items.add(createCategory("dir_/storage/emulated/0/Music", "Musica", "Cartella /Music"))
        items.add(createCategory("dir_/storage/emulated/0/Download", "Download", "Cartella /Download"))
        result.sendResult(items)
      }
      parentId.startsWith("dir_") -> {
        browseDirectory(File(parentId.removePrefix("dir_")), items)
        result.sendResult(items)
      }
      parentId == CAT_ARTISTS -> {
        val artists = allAudio.groupBy { parseArtist(it) }
        artists.keys.sorted().forEach { art ->
          val count = artists[art]?.size ?: 0
          items.add(createCategory("art_$art", art, "$count brani"))
        }
        result.sendResult(items)
      }
      parentId.startsWith("art_") -> {
        val target = parentId.removePrefix("art_")
        allAudio.filter { parseArtist(it) == target }.forEach { items.add(createPlayableItem(it)) }
        result.sendResult(items)
      }
      parentId == CAT_ALBUMS -> {
        val albums = allAudio.groupBy { parseAlbum(it) }
        albums.keys.sorted().forEach { alb ->
          val count = albums[alb]?.size ?: 0
          items.add(createCategory("alb_$alb", alb, "$count brani"))
        }
        result.sendResult(items)
      }
      parentId.startsWith("alb_") -> {
        val target = parentId.removePrefix("alb_")
        allAudio.filter { parseAlbum(it) == target }.forEach { items.add(createPlayableItem(it)) }
        result.sendResult(items)
      }
      else -> result.sendResult(emptyList())
    }
  }

  private fun browseDirectory(dir: File, out: MutableList<MediaItem>) {
    if (!dir.exists() || !dir.isDirectory) return
    dir.listFiles()?.sortedWith(compareBy({ !it.isDirectory }, { it.name.lowercase() }))?.forEach { f ->
      if (f.name.startsWith(".")) return@forEach
      if (f.isDirectory) {
        out.add(createCategory("dir_${f.absolutePath}", f.name, "Cartella"))
      } else if (f.isFile && AUDIO_EXTS.contains(f.extension.lowercase())) {
        out.add(createPlayableItem(f))
      }
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
      .setSubtitle(parseArtist(file))
      .setMediaUri(Uri.fromFile(file))
      .build()
    return MediaItem(desc, MediaItem.FLAG_PLAYABLE)
  }

  private fun parseArtist(file: File): String {
    val parts = file.nameWithoutExtension.split(" - ")
    if (parts.size >= 2) return parts[0].trim()
    val grand = file.parentFile?.parentFile?.name
    if (!grand.isNullOrEmpty() && grand != "Music" && grand != "Download" && grand != "0") return grand
    return "Varie"
  }

  private fun parseAlbum(file: File): String {
    val parent = file.parentFile?.name
    if (!parent.isNullOrEmpty() && parent != "Music" && parent != "Download" && parent != "0") return parent
    return "Singoli"
  }

  private fun getAllLocalAudioFiles(): List<File> {
    val list = mutableListOf<File>()
    val roots = listOf(File("/storage/emulated/0/Music"), File("/storage/emulated/0/Download"))
    fun scan(dir: File) {
      if (!dir.exists() || !dir.isDirectory) return
      dir.listFiles()?.forEach { f ->
        if (f.name.startsWith(".")) return@forEach
        if (f.isDirectory) scan(f)
        else if (f.isFile && AUDIO_EXTS.contains(f.extension.lowercase())) list.add(f)
      }
    }
    roots.forEach { scan(it) }
    return list
  }
}

package org.blasopen.musicplayer

import android.content.Context
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat

/**
 * Gestore centralizzato di MediaSessionCompat per Android Auto e Bluetooth AVRCP.
 * Riceve i comandi dai tasti al volante e dal cruscotto dell'auto, sincronizzando
 * i metadati e lo stato di riproduzione del player musicale.
 */
object MediaSessionManager {
  private const val TAG = "BlasMediaSession"
  private var mediaSession: MediaSessionCompat? = null

  // Callback registrata da MainActivity per trasmettere i comandi alla WebView
  var onActionCallback: ((action: String, arg: String?) -> Unit)? = null

  val sessionToken: MediaSessionCompat.Token?
    get() = mediaSession?.sessionToken

  fun init(context: Context) {
    if (mediaSession != null) return

    mediaSession = MediaSessionCompat(context, TAG).apply {
      setFlags(
        MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
        MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
      )

      setCallback(object : MediaSessionCompat.Callback() {
        override fun onPlay() {
          updateState(true, 0)
          onActionCallback?.invoke("play", null)
        }

        override fun onPause() {
          updateState(false, 0)
          onActionCallback?.invoke("pause", null)
        }

        override fun onSkipToNext() {
          onActionCallback?.invoke("next", null)
        }

        override fun onSkipToPrevious() {
          onActionCallback?.invoke("prev", null)
        }

        override fun onPlayFromMediaId(mediaId: String?, extras: android.os.Bundle?) {
          if (!mediaId.isNullOrEmpty()) {
            onActionCallback?.invoke("play_track", mediaId)
          }
        }

        override fun onSeekTo(pos: Long) {
          onActionCallback?.invoke("seek", pos.toString())
        }
      })

      isActive = true
      updateState(false, 0)
    }
  }

  fun updateState(isPlaying: Boolean, positionMs: Long) {
    val state = if (isPlaying) PlaybackStateCompat.STATE_PLAYING else PlaybackStateCompat.STATE_PAUSED
    val actions = PlaybackStateCompat.ACTION_PLAY or
                  PlaybackStateCompat.ACTION_PAUSE or
                  PlaybackStateCompat.ACTION_PLAY_PAUSE or
                  PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                  PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                  PlaybackStateCompat.ACTION_SEEK_TO

    val stateCompat = PlaybackStateCompat.Builder()
      .setActions(actions)
      .setState(state, positionMs, 1.0f)
      .build()

    mediaSession?.setPlaybackState(stateCompat)
  }

  fun updateMetadata(title: String, artist: String, album: String, durationMs: Long) {
    val meta = MediaMetadataCompat.Builder()
      .putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
      .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
      .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, album.ifEmpty { "BlasMusic" })
      .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, durationMs)
      .build()

    mediaSession?.setMetadata(meta)
  }

  fun release() {
    mediaSession?.isActive = false
    mediaSession?.release()
    mediaSession = null
  }
}

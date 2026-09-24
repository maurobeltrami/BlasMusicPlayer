package org.blasopen.musicplayer

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Bundle
import android.support.v4.media.MediaBrowserCompat.MediaItem
import androidx.core.app.NotificationCompat
import androidx.media.MediaBrowserServiceCompat
import androidx.media.app.NotificationCompat.MediaStyle

/**
 * Servizio Foreground multimediale compatibile con Android Auto e Bluetooth AVRCP.
 * Estende MediaBrowserServiceCompat per esporre la libreria musicale all'infotainment.
 */
class AudioService : MediaBrowserServiceCompat() {
  companion object {
    private const val CHANNEL_ID = "blas_audio_channel"
    private const val NOTIFICATION_ID = 101

    fun start(context: Context) {
      val intent = Intent(context, AudioService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, AudioService::class.java))
    }
  }

  override fun onCreate() {
    super.onCreate()
    MediaSessionManager.init(this)
    sessionToken = MediaSessionManager.sessionToken

    createNotificationChannel()
    val notification = createNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    return START_STICKY
  }

  override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?): BrowserRoot {
    return BrowserRoot(MediaCatalogHelper.MEDIA_ROOT_ID, null)
  }

  override fun onLoadChildren(parentId: String, result: Result<List<MediaItem>>) {
    MediaCatalogHelper.loadChildren(parentId, result)
  }

  override fun onDestroy() {
    MediaSessionManager.release()
    super.onDestroy()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Riproduzione Audio BlasMusic",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Mantiene attiva la riproduzione in background, auto e standby"
        setShowBadge(false)
      }
      getSystemService(NotificationManager::class.java)?.createNotificationChannel(channel)
    }
  }

  private fun createNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val pendingIntent = PendingIntent.getActivity(
      this, 0, launchIntent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )

    val style = MediaStyle().setMediaSession(sessionToken)

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("BlasMusicPlayer")
      .setContentText("Pronto per la riproduzione in auto e background")
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentIntent(pendingIntent)
      .setStyle(style)
      .setColor(0xFF39FF14.toInt()) // Verde acido punk BlasOpen per il cruscotto
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
  }
}

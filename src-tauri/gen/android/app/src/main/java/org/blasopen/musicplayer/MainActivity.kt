package org.blasopen.musicplayer

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
  private var webViewRef: WebView? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    AudioService.start(this)

    // Collega i comandi dai tasti al volante e Android Auto alla WebView
    MediaSessionManager.onActionCallback = { action, arg ->
      dispatchMediaCommand(action, arg)
    }

    val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
    wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BlasMusicPlayer:AudioWakeLock")
    wakeLock?.acquire(24 * 60 * 60 * 1000L)

    requestAudioPermissions()
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
    webView.addJavascriptInterface(MediaBridge(), "AndroidMediaBridge")
    webView.settings.apply {
      mediaPlaybackRequiresUserGesture = false
      setSupportZoom(false)
      builtInZoomControls = false
      displayZoomControls = false
      useWideViewPort = false
      loadWithOverviewMode = false
    }
  }

  override fun onPause() {
    super.onPause()
    webViewRef?.onResume()
  }

  override fun onStop() {
    super.onStop()
    webViewRef?.onResume()
  }

  override fun onDestroy() {
    MediaSessionManager.onActionCallback = null
    wakeLock?.let { if (it.isHeld) it.release() }
    AudioService.stop(this)
    super.onDestroy()
  }

  private fun dispatchMediaCommand(action: String, arg: String?) {
    webViewRef?.post {
      val safeArg = arg?.replace("'", "\\'") ?: ""
      val js = "window.dispatchEvent(new CustomEvent('native-media-command', { detail: { action: '$action', arg: '$safeArg' } }));"
      webViewRef?.evaluateJavascript(js, null)
    }
  }

  private fun requestAudioPermissions() {
    val perms = mutableListOf<String>()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        perms.add(Manifest.permission.READ_MEDIA_AUDIO)
      }
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        perms.add(Manifest.permission.POST_NOTIFICATIONS)
      }
    } else {
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
        perms.add(Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }
    if (perms.isNotEmpty()) {
      ActivityCompat.requestPermissions(this, perms.toTypedArray(), 1001)
    }
  }

  inner class MediaBridge {
    @JavascriptInterface
    fun updateMetadata(title: String, artist: String, album: String, durationMs: Long) {
      MediaSessionManager.updateMetadata(title, artist, album, durationMs)
    }

    @JavascriptInterface
    fun updatePlaybackState(isPlaying: Boolean, positionMs: Long) {
      MediaSessionManager.updateState(isPlaying, positionMs)
    }
  }
}

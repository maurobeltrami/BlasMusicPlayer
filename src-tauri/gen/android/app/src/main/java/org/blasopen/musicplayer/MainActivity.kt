package org.blasopen.musicplayer

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.webkit.WebView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : TauriActivity() {
  private var webViewRef: WebView? = null
  private var wakeLock: PowerManager.WakeLock? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // WakeLock parziale per prevenire sospensione CPU a schermo spento
    val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
    wakeLock = powerManager?.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BlasMusicPlayer:AudioWakeLock")
    wakeLock?.acquire(24 * 60 * 60 * 1000L)

    requestAudioPermissions()
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    webViewRef = webView
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
    // WryActivity.onPause() blocca il webView; lo riattiviamo per permettere audio in background
    webViewRef?.onResume()
  }

  override fun onDestroy() {
    wakeLock?.let { if (it.isHeld) it.release() }
    super.onDestroy()
  }

  private fun requestAudioPermissions() {
    val perms = mutableListOf<String>()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
        perms.add(Manifest.permission.READ_MEDIA_AUDIO)
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
}

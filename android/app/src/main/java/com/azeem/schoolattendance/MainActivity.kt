package com.azeem.schoolattendance

import android.annotation.SuppressLint
import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.ContentValues
import android.provider.MediaStore
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.os.Build
import android.os.Environment
import android.webkit.JavascriptInterface
import android.widget.Toast
import android.util.Base64
import java.io.File
import android.view.ViewGroup
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var appUpdater: AppUpdater
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }


    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val values = if (result.resultCode == Activity.RESULT_OK) {
            WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
        } else null
        filePathCallback?.onReceiveValue(values)
        filePathCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)

        val loader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#006743"))
        }

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = true
            addJavascriptInterface(object {
                @JavascriptInterface fun saveFile(fileName: String, base64: String) {
                    try {
                        val safe=fileName.replace(Regex("[^A-Za-z0-9._-]"), "_")
                        val bytes=Base64.decode(base64,Base64.DEFAULT)
                        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                            val values=ContentValues().apply {
                                put(MediaStore.Downloads.DISPLAY_NAME,safe)
                                put(MediaStore.Downloads.MIME_TYPE,when { safe.endsWith(".doc",true) -> "application/msword"; safe.endsWith(".pdf",true) -> "application/pdf"; else -> "application/octet-stream" })
                                put(MediaStore.Downloads.RELATIVE_PATH,Environment.DIRECTORY_DOWNLOADS)
                                put(MediaStore.Downloads.IS_PENDING,1)
                            }
                            val uri=contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI,values)
                                ?: throw IllegalStateException("Could not create download")
                            contentResolver.openOutputStream(uri)?.use { it.write(bytes) }
                                ?: throw IllegalStateException("Could not open download")
                            values.clear()
                            values.put(MediaStore.Downloads.IS_PENDING,0)
                            contentResolver.update(uri,values,null,null)
                        } else {
                            @Suppress("DEPRECATION")
                            val dir=Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                            if(!dir.exists()) dir.mkdirs()
                            File(dir,safe).writeBytes(bytes)
                        }
                        runOnUiThread{Toast.makeText(this@MainActivity,"Saved to Downloads/$safe",Toast.LENGTH_LONG).show()}
                    } catch (_:Exception) {
                        runOnUiThread{Toast.makeText(this@MainActivity,"Could not save exported file",Toast.LENGTH_SHORT).show()}
                    }
                }
            }, "AndroidDownloads")
            addJavascriptInterface(object {
                @JavascriptInterface fun setAuthToken(token: String) {
                    getSharedPreferences("school_native_auth", MODE_PRIVATE)
                        .edit().putString("auth_token", token).apply()
                    NotificationSyncWorker.schedule(this@MainActivity)
                    NotificationSyncWorker.runNow(this@MainActivity)
                }

                @JavascriptInterface fun clearAuthToken() {
                    getSharedPreferences("school_native_auth", MODE_PRIVATE)
                        .edit().remove("auth_token").apply()
                }

                @JavascriptInterface fun show(id: String, title: String, message: String) {
                    SchoolNotificationManager.show(this@MainActivity, id, title, message)
                }
            }, "AndroidNotifications")
            setBackgroundColor(Color.parseColor("#F4FAF7"))
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    webView: WebView?,
                    callback: ValueCallback<Array<Uri>>?,
                    fileChooserParams: FileChooserParams?
                ): Boolean {
                    if (callback == null || fileChooserParams == null) return false
                    filePathCallback?.onReceiveValue(null)
                    filePathCallback = callback
                    return try {
                        val intent: Intent = fileChooserParams.createIntent()
                        fileChooserLauncher.launch(intent)
                        true
                    } catch (_: Exception) {
                        filePathCallback = null
                        false
                    }
                }
            }
            webViewClient = object : WebViewClientCompat() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
            }
        }

        root.addView(
            webView,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(root)

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val status = insets.getInsets(WindowInsetsCompat.Type.statusBars())
            val navigation = insets.getInsets(WindowInsetsCompat.Type.navigationBars())
            view.setPadding(0, status.top, 0, navigation.bottom)
            WindowInsetsCompat.CONSUMED
        }
        ViewCompat.requestApplyInsets(root)

        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }

        SchoolNotificationManager.createChannel(this)
        NotificationSyncWorker.schedule(this)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        appUpdater = AppUpdater(this)

        if (savedInstanceState == null) {
            webView.loadUrl("https://appassets.androidplatform.net/web/index.html")
            appUpdater.checkForUpdates()
        } else {
            webView.restoreState(savedInstanceState)
        }

        if (intent?.getBooleanExtra("open_notifications", false) == true) {
            webView.postDelayed({
                webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('open-notifications'))", null)
            }, 900)
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) webView.goBack() else finish()
            }
        })
    }

    override fun onResume() {
        super.onResume()
        if (::appUpdater.isInitialized) appUpdater.onResume()
        val token = getSharedPreferences("school_native_auth", MODE_PRIVATE)
            .getString("auth_token", null)
        if (!token.isNullOrBlank()) {
            NotificationSyncWorker.runNow(this)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        if (intent.getBooleanExtra("open_notifications", false) && ::webView.isInitialized) {
            webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('open-notifications'))", null)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        filePathCallback?.onReceiveValue(null)
        filePathCallback = null
        if (::appUpdater.isInitialized) appUpdater.destroy()
        webView.destroy()
        super.onDestroy()
    }
}

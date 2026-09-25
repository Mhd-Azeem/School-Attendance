package com.azeem.schoolattendance

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
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
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private lateinit var appUpdater: AppUpdater
    private var filePathCallback: ValueCallback<Array<Uri>>? = null

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
                @JavascriptInterface fun saveCsv(fileName: String, base64: String) {
                    try { val safe=fileName.replace(Regex("[^A-Za-z0-9._-]"), "_"); val dir=getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS) ?: filesDir; val file=File(dir,safe); file.writeBytes(Base64.decode(base64,Base64.DEFAULT)); runOnUiThread{Toast.makeText(this@MainActivity,"CSV saved: ${file.absolutePath}",Toast.LENGTH_LONG).show()} } catch (_:Exception) { runOnUiThread{Toast.makeText(this@MainActivity,"Could not save CSV",Toast.LENGTH_SHORT).show()} }
                }
            }, "AndroidDownloads")
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

        appUpdater = AppUpdater(this)

        if (savedInstanceState == null) {
            webView.loadUrl("https://appassets.androidplatform.net/web/index.html")
            appUpdater.checkForUpdates()
        } else {
            webView.restoreState(savedInstanceState)
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

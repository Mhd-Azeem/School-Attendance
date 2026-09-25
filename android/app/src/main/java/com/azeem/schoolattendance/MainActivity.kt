package com.azeem.schoolattendance

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 15+ draws apps edge-to-edge. Handle system-bar insets explicitly so
        // the green app header never sits underneath the phone status/notification bar.
        WindowCompat.setDecorFitsSystemWindows(window, false)

        val loader=WebViewAssetLoader.Builder()
            .addPathHandler("/",WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView=WebView(this).apply {
            settings.javaScriptEnabled=true
            settings.domStorageEnabled=true
            settings.databaseEnabled=true
            settings.allowFileAccess=false
            settings.allowContentAccess=false
            setBackgroundColor(Color.parseColor("#006743"))
            webChromeClient=WebChromeClient()
            webViewClient=object:WebViewClientCompat(){
                override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)
            }
        }

        setContentView(webView)

        ViewCompat.setOnApplyWindowInsetsListener(webView){view,insets->
            val bars=insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(0,bars.top,0,bars.bottom)
            insets
        }
        ViewCompat.requestApplyInsets(webView)

        WindowCompat.getInsetsController(window,webView).apply {
            isAppearanceLightStatusBars=false
            isAppearanceLightNavigationBars=false
        }

        if(savedInstanceState==null) webView.loadUrl("https://appassets.androidplatform.net/web/index.html") else webView.restoreState(savedInstanceState)

        onBackPressedDispatcher.addCallback(this,object:OnBackPressedCallback(true){
            override fun handleOnBackPressed(){if(webView.canGoBack())webView.goBack() else finish()}
        })
    }

    override fun onSaveInstanceState(outState:Bundle){webView.saveState(outState);super.onSaveInstanceState(outState)}
    override fun onDestroy(){webView.destroy();super.onDestroy()}
}

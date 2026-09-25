package com.azeem.schoolattendance

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val loader=WebViewAssetLoader.Builder()
            .addPathHandler("/",WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView=WebView(this).apply {
            settings.javaScriptEnabled=true
            settings.domStorageEnabled=true
            settings.databaseEnabled=true
            settings.allowFileAccess=false
            settings.allowContentAccess=false
            webChromeClient=WebChromeClient()
            webViewClient=object:WebViewClientCompat(){
                override fun shouldInterceptRequest(view:WebView,request:WebResourceRequest):WebResourceResponse? =
                    loader.shouldInterceptRequest(request.url)
            }
        }
        setContentView(webView)
        if(savedInstanceState==null) webView.loadUrl("https://appassets.androidplatform.net/web/index.html") else webView.restoreState(savedInstanceState)
        onBackPressedDispatcher.addCallback(this,object:OnBackPressedCallback(true){
            override fun handleOnBackPressed(){if(webView.canGoBack())webView.goBack() else finish()}
        })
    }
    override fun onSaveInstanceState(outState:Bundle){webView.saveState(outState);super.onSaveInstanceState(outState)}
    override fun onDestroy(){webView.destroy();super.onDestroy()}
}

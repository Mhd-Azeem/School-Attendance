package com.azeem.schoolattendance

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.azeem.schoolattendance.update.AppUpdate
import com.azeem.schoolattendance.update.UpdateChecker

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { OriginalApp() } }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun OriginalApp() {
    val context=LocalContext.current
    var webView by remember { mutableStateOf<WebView?>(null) }
    var update by remember { mutableStateOf<AppUpdate?>(null) }

    LaunchedEffect(Unit) {
        runCatching { UpdateChecker.check() }.onSuccess { update=it }
    }

    update?.let { u ->
        AlertDialog(
            onDismissRequest={update=null},
            title={Text("Update available")},
            text={Text("School Attendance ${u.version} is available. Download the latest Original APK?")},
            confirmButton={TextButton(onClick={UpdateChecker.openDownload(context,u);update=null}){Text("Update")}},
            dismissButton={TextButton(onClick={update=null}){Text("Later")}}
        )
    }

    BackHandler(enabled=webView?.canGoBack()==true) { webView?.goBack() }

    AndroidView(
        modifier=Modifier.fillMaxSize(),
        factory={ctx->
            WebView(ctx).apply {
                settings.javaScriptEnabled=true
                settings.domStorageEnabled=true
                settings.databaseEnabled=true
                settings.allowFileAccess=true
                settings.allowContentAccess=true
                webViewClient=object:WebViewClient(){
                    override fun shouldOverrideUrlLoading(view:WebView?,url:String?):Boolean=false
                }
                webChromeClient=WebChromeClient()
                loadUrl("file:///android_asset/web/index.html")
                webView=this
            }
        }
    )
}

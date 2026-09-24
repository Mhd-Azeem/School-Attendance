package com.azeem.schoolattendance.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.azeem.schoolattendance.BuildConfig
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.request.get
import io.ktor.client.request.header
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json

@Serializable data class ReleaseAsset(val name:String,@SerialName("browser_download_url") val downloadUrl:String)
@Serializable data class GithubRelease(@SerialName("tag_name") val tagName:String,@SerialName("html_url") val htmlUrl:String,val assets:List<ReleaseAsset> = emptyList(),val prerelease:Boolean=false,val draft:Boolean=false)
data class AppUpdate(val version:String,val apkUrl:String,val releaseUrl:String)

object UpdateChecker {
    private const val RELEASES_API="https://api.github.com/repos/Mhd-Azeem/School-Attendance/releases"
    private val client=HttpClient(Android){install(ContentNegotiation){json(Json{ignoreUnknownKeys=true})}}

    suspend fun check():AppUpdate? {
        val releases:List<GithubRelease> = client.get(RELEASES_API){header("Accept","application/vnd.github+json")}.body()
        val release=releases.firstOrNull{!it.draft && it.assets.any{a->a.name.endsWith(".apk",true) && !a.name.contains("Demo",true)} } ?: return null
        val remote=release.tagName.removePrefix("v").substringBefore("-")
        if(compareVersions(remote,BuildConfig.VERSION_NAME)<=0)return null
        val asset=release.assets.first{it.name.endsWith(".apk",true)&&!it.name.contains("Demo",true)}
        return AppUpdate(remote,asset.downloadUrl,release.htmlUrl)
    }

    private fun compareVersions(a:String,b:String):Int {
        val x=a.split(".").map{it.toIntOrNull()?:0};val y=b.substringBefore("-").split(".").map{it.toIntOrNull()?:0}
        for(i in 0 until maxOf(x.size,y.size)){val d=(x.getOrElse(i){0}).compareTo(y.getOrElse(i){0});if(d!=0)return d}
        return 0
    }

    fun openDownload(context:Context,update:AppUpdate){
        context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(update.apkUrl)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

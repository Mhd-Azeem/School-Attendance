package com.azeem.schoolattendance

import android.app.AlertDialog
import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.widget.Toast
import androidx.core.content.FileProvider
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class AppUpdater(private val activity: MainActivity) {
    companion object {
        private const val LATEST_RELEASE_API =
            "https://api.github.com/repos/Mhd-Azeem/School-Attendance/releases/latest"
        private const val APK_ASSET_NAME = "School-Attendance-INSTALL.apk"
    }

    private var pendingInstallFile: File? = null
    private var downloadReceiver: BroadcastReceiver? = null

    fun checkForUpdates() {
        thread {
            runCatching { fetchLatestRelease() }
                .onSuccess { release ->
                    if (release.buildNumber > installedVersionCode()) {
                        activity.runOnUiThread { showUpdateDialog(release) }
                    }
                }
        }
    }

    fun onResume() {
        val file = pendingInstallFile ?: return
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O ||
            activity.packageManager.canRequestPackageInstalls()
        ) {
            pendingInstallFile = null
            installApk(file)
        }
    }

    private fun installedVersionCode(): Long {
        val info = activity.packageManager.getPackageInfo(activity.packageName, 0)
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            info.longVersionCode
        } else {
            @Suppress("DEPRECATION")
            info.versionCode.toLong()
        }
    }

    private fun fetchLatestRelease(): ReleaseInfo {
        val connection = (URL(LATEST_RELEASE_API).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 10_000
            readTimeout = 10_000
            setRequestProperty("Accept", "application/vnd.github+json")
            setRequestProperty("User-Agent", "School-Attendance-Android-Updater")
        }

        connection.inputStream.bufferedReader().use { reader ->
            val json = JSONObject(reader.readText())
            val body = json.optString("body", "")
            val tag = json.optString("tag_name", "")
            // Compare Android versionCode, not the GitHub Actions run number.
            // Release body contains: "Build number: <versionCode>".
            val versionCode = Regex("""(?im)^\s*Build number:\s*(\d+)\s*$""")
                .find(body)?.groupValues?.get(1)?.toLongOrNull()
                ?: Regex("""apk-v(\d+)\.(\d+)\.(\d+)""", RegexOption.IGNORE_CASE)
                    .find(tag)?.let { m ->
                        val major=m.groupValues[1].toLong()
                        val minor=m.groupValues[2].toLong()
                        val patch=m.groupValues[3].toLong()
                        major*10000L+minor*100L+patch
                    }
                ?: 0L

            val assets = json.getJSONArray("assets")
            var apkUrl: String? = null
            for (i in 0 until assets.length()) {
                val asset = assets.getJSONObject(i)
                if (asset.optString("name") == APK_ASSET_NAME) {
                    apkUrl = asset.optString("browser_download_url")
                    break
                }
            }

            if (buildNumber <= 0L || apkUrl.isNullOrBlank()) {
                error("Latest release does not contain a valid build number or $APK_ASSET_NAME")
            }

            return ReleaseInfo(
                buildNumber = versionCode,
                versionLabel = json.optString("name", tag),
                apkUrl = apkUrl
            )
        }
    }

    private fun showUpdateDialog(release: ReleaseInfo) {
        if (activity.isFinishing || activity.isDestroyed) return

        AlertDialog.Builder(activity)
            .setTitle("School Attendance update available")
            .setMessage(
                "${release.versionLabel}\n\n" +
                    "A newer version is available. Download and install it now?"
            )
            .setNegativeButton("Later", null)
            .setPositiveButton("Download & update") { _, _ ->
                downloadUpdate(release)
            }
            .show()
    }

    private fun downloadUpdate(release: ReleaseInfo) {
        val fileName = "School-Attendance-update-${release.buildNumber}.apk"
        val target = File(
            activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
            fileName
        )
        if (target.exists()) target.delete()

        val request = DownloadManager.Request(Uri.parse(release.apkUrl))
            .setTitle("School Attendance update")
            .setDescription("Downloading ${release.versionLabel}")
            .setMimeType("application/vnd.android.package-archive")
            .setNotificationVisibility(
                DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
            )
            .setDestinationInExternalFilesDir(
                activity,
                Environment.DIRECTORY_DOWNLOADS,
                fileName
            )

        val manager = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = manager.enqueue(request)

        downloadReceiver?.let { runCatching { activity.unregisterReceiver(it) } }
        downloadReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                if (intent?.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) != downloadId) return

                val query = DownloadManager.Query().setFilterById(downloadId)
                manager.query(query)?.use { cursor ->
                    if (!cursor.moveToFirst()) return
                    val status = cursor.getInt(
                        cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)
                    )
                    if (status == DownloadManager.STATUS_SUCCESSFUL) {
                        unregisterReceiver()
                        requestInstall(target)
                    } else if (status == DownloadManager.STATUS_FAILED) {
                        unregisterReceiver()
                        Toast.makeText(activity, "Update download failed.", Toast.LENGTH_LONG).show()
                    }
                }
            }
        }

        val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            activity.registerReceiver(downloadReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            activity.registerReceiver(downloadReceiver, filter)
        }
    }

    private fun requestInstall(file: File) {
        if (!file.exists()) {
            Toast.makeText(activity, "Downloaded update file was not found.", Toast.LENGTH_LONG).show()
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
            !activity.packageManager.canRequestPackageInstalls()
        ) {
            pendingInstallFile = file
            val intent = Intent(
                Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:${activity.packageName}")
            )
            activity.startActivity(intent)
            return
        }

        installApk(file)
    }

    private fun installApk(file: File) {
        val uri = FileProvider.getUriForFile(
            activity,
            "${activity.packageName}.fileprovider",
            file
        )
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        activity.startActivity(intent)
    }

    fun destroy() {
        unregisterReceiver()
    }

    private fun unregisterReceiver() {
        downloadReceiver?.let { receiver ->
            runCatching { activity.unregisterReceiver(receiver) }
        }
        downloadReceiver = null
    }

    private data class ReleaseInfo(
        val buildNumber: Long,
        val versionLabel: String,
        val apkUrl: String
    )
}

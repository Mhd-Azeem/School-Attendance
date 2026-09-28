package com.azeem.schoolattendance

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.TimeUnit

object SchoolNotificationManager {
    const val CHANNEL_ID = "school_attendance_reminders"
    private const val PREFS = "school_notification_prefs"
    private const val SHOWN_IDS = "shown_notification_ids"

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Attendance reminders",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Student attendance reminders and important school attendance alerts"
                enableVibration(true)
            }
            context.getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    fun show(context: Context, id: String, title: String, message: String, dedupe: Boolean = true) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return

        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (dedupe) {
            val shown = prefs.getStringSet(SHOWN_IDS, emptySet()) ?: emptySet()
            if (shown.contains(id)) return
            val next = shown.toMutableSet()
            next.add(id)
            if (next.size > 250) {
                val keep = next.takeLast(200).toSet()
                prefs.edit().putStringSet(SHOWN_IDS, keep).apply()
            } else {
                prefs.edit().putStringSet(SHOWN_IDS, next).apply()
            }
        }

        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("open_notifications", true)
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            id.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(id.hashCode(), notification)
    }

    fun resetShown(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit().remove(SHOWN_IDS).apply()
    }
}

class NotificationSyncWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences("school_native_auth", Context.MODE_PRIVATE)
        val token = prefs.getString("auth_token", null) ?: return Result.success()

        return try {
            val conn = (URL("https://school-attendance-api.azeemzahira111.workers.dev/api/notifications").openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 10000
                readTimeout = 10000
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Accept", "application/json")
            }

            val code = conn.responseCode
            if (code == 401) {
                prefs.edit().remove("auth_token").apply()
                conn.disconnect()
                return Result.success()
            }
            if (code !in 200..299) {
                conn.disconnect()
                return Result.retry()
            }

            val body = conn.inputStream.bufferedReader().use { it.readText() }
            conn.disconnect()
            val root = JSONObject(body)
            val notifications = root.optJSONArray("notifications") ?: return Result.success()

            for (i in 0 until notifications.length()) {
                val n = notifications.optJSONObject(i) ?: continue
                if (n.optInt("is_read", 0) != 0) continue
                val id = n.optString("id")
                if (id.isBlank()) continue
                SchoolNotificationManager.show(
                    applicationContext,
                    "server-$id",
                    n.optString("title", "School Attendance"),
                    n.optString("message", "You have a new attendance reminder.")
                )
            }
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    companion object {
        private const val PERIODIC_NAME = "school-notification-sync"
        private const val IMMEDIATE_NAME = "school-notification-sync-now"

        fun schedule(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val work = PeriodicWorkRequestBuilder<NotificationSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                work
            )
        }

        fun runNow(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val work = OneTimeWorkRequestBuilder<NotificationSyncWorker>()
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(context).enqueueUniqueWork(
                IMMEDIATE_NAME,
                ExistingWorkPolicy.REPLACE,
                work
            )
        }
    }
}

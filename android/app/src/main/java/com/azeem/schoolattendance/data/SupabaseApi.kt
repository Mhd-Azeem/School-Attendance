package com.azeem.schoolattendance.data

import com.azeem.schoolattendance.BuildConfig
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.client.request.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

class SupabaseApi(private val store: SessionStore) {
    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true })
        }
    }

    private fun io.ktor.client.request.HttpRequestBuilder.common() {
        store.accessToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
    }

    suspend fun login(username: String, password: String): Profile {
        val auth: LoginResponse = client.post("${BuildConfig.API_URL}/api/auth/login") {
            contentType(ContentType.Application.Json)
            setBody(LoginRequest(username, password))
        }.body()
        store.accessToken = auth.token
        return auth.user
    }

    suspend fun me(): Profile {\n        return client.get("${BuildConfig.API_URL}/api/auth/me") { common() }.body<MeResponse>().user\n    }\n\n    suspend fun classes(): List<SchoolClass> {
        return client.get("${BuildConfig.API_URL}/api/classes") {
            common()
        }.body<ClassesResponse>().classes
    }

    suspend fun students(classId: String): List<Student> {
        return client.get("${BuildConfig.API_URL}/api/classes/$classId/students") {
            common()
        }.body<StudentsResponse>().students
    }

    fun logout() {
        store.clear()
    }
}

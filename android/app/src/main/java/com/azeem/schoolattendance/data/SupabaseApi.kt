package com.azeem.schoolattendance.data
import com.azeem.schoolattendance.BuildConfig
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
class SupabaseApi(private val store:SessionStore){
 private val client=HttpClient(Android){install(ContentNegotiation){json(Json{ignoreUnknownKeys=true})}}
 private fun HttpRequestBuilder.common(){store.accessToken?.let{header(HttpHeaders.Authorization,"Bearer $it")}}
 suspend fun login(username:String,password:String):Profile{val auth:LoginResponse=client.post("${BuildConfig.API_URL}/api/auth/login"){contentType(ContentType.Application.Json);setBody(LoginRequest(username,password))}.body();store.accessToken=auth.token;return auth.user}
 suspend fun classes():List<SchoolClass>=client.get("${BuildConfig.API_URL}/api/classes"){common()}.body<ClassesResponse>().classes
 suspend fun students(classId:String):List<Student>=client.get("${BuildConfig.API_URL}/api/classes/${classId}/students"){common()}.body<StudentsResponse>().students
 fun logout(){store.clear()}
}

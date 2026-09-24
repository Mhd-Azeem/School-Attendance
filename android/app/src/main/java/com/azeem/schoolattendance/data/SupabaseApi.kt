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
 private fun HttpRequestBuilder.common(){header("apikey",BuildConfig.SUPABASE_ANON_KEY);store.accessToken?.let{header(HttpHeaders.Authorization,"Bearer $it")}}
 suspend fun login(email:String,password:String):Profile{require(BuildConfig.SUPABASE_URL.isNotBlank()){"Supabase is not configured"};val auth:AuthResponse=client.post("${BuildConfig.SUPABASE_URL}/auth/v1/token?grant_type=password"){header("apikey",BuildConfig.SUPABASE_ANON_KEY);contentType(ContentType.Application.Json);setBody(AuthRequest(email,password))}.body();store.accessToken=auth.accessToken;store.refreshToken=auth.refreshToken;return profile(auth.user.id)}
 suspend fun profile(id:String):Profile=client.get("${BuildConfig.SUPABASE_URL}/rest/v1/profiles"){common();parameter("id","eq.$id");parameter("select","id,full_name,role,is_active");header("Accept","application/vnd.pgrst.object+json")}.body()
 suspend fun classes(): List<SchoolClass> = client.get("${BuildConfig.SUPABASE_URL}/rest/v1/classes"){common();parameter("select","id,display_name,grade_id");parameter("is_active","eq.true");parameter("order","display_name")}.body()
 suspend fun students(classId:String): List<Student> = client.get("${BuildConfig.SUPABASE_URL}/rest/v1/students"){common();parameter("select","id,admission_number,full_name,class_id,is_active");parameter("class_id","eq.$classId");parameter("is_active","eq.true");parameter("order","admission_number")}.body()
 fun logout(){store.clear()}
}

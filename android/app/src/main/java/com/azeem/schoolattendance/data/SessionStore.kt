package com.azeem.schoolattendance.data
import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
class SessionStore(context:Context){
 private val prefs=EncryptedSharedPreferences.create(context,"secure_session",MasterKey.Builder(context).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
 var accessToken:String? get()=prefs.getString("access",null); set(v)=prefs.edit().putString("access",v).apply()
 var refreshToken:String? get()=prefs.getString("refresh",null); set(v)=prefs.edit().putString("refresh",v).apply()
 fun clear()=prefs.edit().clear().apply()
}


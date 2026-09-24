package com.azeem.schoolattendance.data
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
@Serializable data class AuthRequest(val email:String,val password:String)
@Serializable data class AuthResponse(@SerialName("access_token") val accessToken:String,@SerialName("refresh_token") val refreshToken:String,val user:AuthUser)
@Serializable data class AuthUser(val id:String,val email:String?=null)
@Serializable data class Profile(val id:String,@SerialName("full_name") val fullName:String,val role:String,@SerialName("is_active") val isActive:Boolean)
@Serializable data class SchoolClass(val id:String,@SerialName("display_name") val displayName:String,@SerialName("grade_id") val gradeId:String)
@Serializable data class Student(val id:String,@SerialName("admission_number") val admissionNumber:String,@SerialName("full_name") val fullName:String,@SerialName("class_id") val classId:String,@SerialName("is_active") val isActive:Boolean)


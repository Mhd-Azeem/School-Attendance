package com.azeem.schoolattendance.data
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
@Serializable data class LoginRequest(val username:String,val password:String)
@Serializable data class LoginResponse(val token:String,val user:Profile)
@Serializable data class Profile(val id:String,@SerialName("full_name") val fullName:String,val username:String,val role:String,@SerialName("is_active") val isActive:Boolean=true)
@Serializable data class ClassesResponse(val classes:List<SchoolClass>)
@Serializable data class StudentsResponse(val students:List<Student>)
@Serializable data class SchoolClass(val id:String,@SerialName("display_name") val displayName:String,@SerialName("grade_id") val gradeId:String)
@Serializable data class Student(val id:String,@SerialName("admission_number") val admissionNumber:String,@SerialName("full_name") val fullName:String,@SerialName("class_id") val classId:String,@SerialName("is_active") val isActive:Boolean=true)

@Serializable data class MeResponse(val user:Profile)

plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }
android {
 namespace="com.azeem.schoolattendance"; compileSdk=36
 defaultConfig { applicationId="com.azeem.schoolattendance"; minSdk=26; targetSdk=36; versionCode=24; versionName="0.2.12" }
 buildTypes { release { isMinifyEnabled=true; isShrinkResources=true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"),"proguard-rules.pro") } }
 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget="17" }
}
dependencies { implementation("androidx.activity:activity-ktx:1.11.0"); implementation("androidx.webkit:webkit:1.14.0") }

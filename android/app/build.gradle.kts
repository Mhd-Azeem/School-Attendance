plugins { id("com.android.application"); id("org.jetbrains.kotlin.android") }

val releaseKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH") ?: ""
val releaseStorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: ""
val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: ""
val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD") ?: ""

android {
 namespace="com.azeem.schoolattendance"; compileSdk=36
 defaultConfig { applicationId="com.azeem.schoolattendance"; minSdk=26; targetSdk=36; versionCode=34; versionName="0.2.22" }

 signingConfigs {
  create("release") {
   if (releaseKeystorePath.isNotBlank()) {
    storeFile = file(releaseKeystorePath)
    storePassword = releaseStorePassword
    keyAlias = releaseKeyAlias
    keyPassword = releaseKeyPassword
   }
  }
 }

 buildTypes {
  release {
   isMinifyEnabled=true
   isShrinkResources=true
   signingConfig=signingConfigs.getByName("release")
   proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"),"proguard-rules.pro")
  }
 }

 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget="17" }
}

dependencies { implementation("androidx.activity:activity-ktx:1.11.0"); implementation("androidx.webkit:webkit:1.14.0") }

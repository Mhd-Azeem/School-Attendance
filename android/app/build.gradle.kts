import java.util.Properties
plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose"); id("org.jetbrains.kotlin.plugin.serialization") }
val local=Properties().apply { rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use(::load) }
android {
 namespace="com.azeem.schoolattendance"; compileSdk=36
 defaultConfig {
  applicationId="com.azeem.schoolattendance"; minSdk=26; targetSdk=36; versionCode=6; versionName="0.1.5"
  buildConfigField("String","API_URL","\"https://school-attendance-api.azeemzahira111.workers.dev\"")
  testInstrumentationRunner="androidx.test.runner.AndroidJUnitRunner"
 }
 buildFeatures { compose=true; buildConfig=true }
 buildTypes { release { isMinifyEnabled=true; proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"),"proguard-rules.pro") } }
 compileOptions { sourceCompatibility=JavaVersion.VERSION_17; targetCompatibility=JavaVersion.VERSION_17 }
 kotlinOptions { jvmTarget="17" }
}
dependencies {
 implementation(platform("androidx.compose:compose-bom:2025.09.00")); implementation("androidx.activity:activity-compose:1.11.0")
 implementation("androidx.compose.material3:material3"); implementation("androidx.webkit:webkit:1.14.0"); implementation("androidx.compose.ui:ui"); implementation("androidx.compose.ui:ui-tooling-preview")
 implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.4"); implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.4")
 implementation("androidx.security:security-crypto:1.1.0-alpha06")
 implementation("io.ktor:ktor-client-android:3.3.0"); implementation("io.ktor:ktor-client-content-negotiation:3.3.0"); implementation("io.ktor:ktor-serialization-kotlinx-json:3.3.0")
 implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2"); implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.7.1")
 debugImplementation("androidx.compose.ui:ui-tooling"); testImplementation("junit:junit:4.13.2")
}

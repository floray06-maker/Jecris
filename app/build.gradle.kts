plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "fr.lyceevictorlaloux.jecris"
    compileSdk = 34

    defaultConfig {
        applicationId = "fr.lyceevictorlaloux.jecris"
        minSdk = 24              // Android 7 et au-delà : couvre le parc scolaire
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    // les fichiers de l'application sont déjà compressés au besoin
    androidResources { noCompress += listOf("json", "html") }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.11.0")
}

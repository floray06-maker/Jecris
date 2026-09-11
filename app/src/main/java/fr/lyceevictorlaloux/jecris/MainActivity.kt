package fr.lyceevictorlaloux.jecris

import android.annotation.SuppressLint
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader

/**
 * J'écris en français — Lycée Victor Laloux, Tours.
 *
 * L'application web est embarquée dans les assets. Point important :
 * elle N'EST PAS chargée en file:// — Android interdirait alors le
 * stockage local, et la progression des élèves serait perdue à chaque
 * fermeture. WebViewAssetLoader la sert sous une origine https locale,
 * ce qui rend IndexedDB parfaitement fonctionnel, hors ligne et sans
 * le moindre accès réseau.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var dernierRetour = 0L

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val loader = WebViewAssetLoader.Builder()
            .setDomain(DOMAINE)
            .addPathHandler("/app/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this)
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            @Suppress("DEPRECATION")
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            textZoom = 100
            cacheMode = android.webkit.WebSettings.LOAD_DEFAULT
        }
        web.isVerticalScrollBarEnabled = false
        web.overScrollMode = View.OVER_SCROLL_NEVER
        web.keepScreenOn = true          // l'écriture comporte des temps d'arrêt

        web.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView, request: WebResourceRequest
            ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

            // rien ne doit ouvrir le navigateur : l'application est close sur elle-même
            override fun shouldOverrideUrlLoading(
                view: WebView, request: WebResourceRequest
            ): Boolean = !request.url.host.equals(DOMAINE, ignoreCase = true)
        }

        if (savedInstanceState == null) web.loadUrl(DEPART) else web.restoreState(savedInstanceState)
        pleinEcran()
    }

    /** Mode immersif : plus de barres, toute la dalle pour tracer. */
    private fun pleinEcran() {
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) pleinEcran()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    /** Deux pressions pour quitter : en classe, une sortie accidentelle coûte une séance. */
    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            val maintenant = System.currentTimeMillis()
            if (maintenant - dernierRetour < 2000) {
                finish()
            } else {
                dernierRetour = maintenant
                Toast.makeText(this, "Appuie encore pour quitter", Toast.LENGTH_SHORT).show()
            }
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    companion object {
        // Domaine réservé par Android à cet usage : aucune requête ne sort de l'appareil.
        private const val DOMAINE = "appassets.androidplatform.net"

        // Pour livrer l'autre application, remplacer le contenu de assets/app
        // et ce seul nom de fichier par « jecris-en-francais.html ».
        private const val DEPART = "https://$DOMAINE/app/jecris-parcours.html"
    }
}

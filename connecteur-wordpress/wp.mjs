#!/usr/bin/env node
/**
 * Connecteur WordPress — nosreussites.org
 *
 * Authentification : Application Password WordPress
 *
 * Commandes :
 *   test                          — vérifie la connexion et affiche l'utilisateur connecté
 *   pages                         — liste les pages
 *   creer-page <titre>            — crée une page brouillon
 *   medias                        — liste les médias (20 derniers)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname( fileURLToPath( import.meta.url ) );
const envPath = resolve( __dir, '.env' );

let env = {};
try {
    const raw = readFileSync( envPath, 'utf8' );
    for ( const line of raw.split( '\n' ) ) {
        const m = line.match( /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)/ );
        if ( m ) env[ m[1] ] = m[2].trim().replace( /^['"]|['"]$/g, '' );
    }
} catch {
    console.error( 'Impossible de lire .env — créez connecteur-wordpress/.env (voir .env.exemple).' );
    process.exit( 1 );
}

const WP_URL  = ( env.WP_URL  || '' ).replace( /\/$/, '' );
const WP_USER = env.WP_USER  || '';
const WP_PASS = env.WP_APP_PASSWORD || '';

if ( ! WP_URL || ! WP_USER || ! WP_PASS ) {
    console.error( 'Variables manquantes dans .env : WP_URL, WP_USER, WP_APP_PASSWORD' );
    process.exit( 1 );
}

const AUTH = 'Basic ' + Buffer.from( `${WP_USER}:${WP_PASS}` ).toString( 'base64' );

async function api( path, options = {} ) {
    const url  = `${WP_URL}/wp-json${path}`;
    const resp = await fetch( url, {
        headers: { Authorization: AUTH, 'Content-Type': 'application/json', ...( options.headers || {} ) },
        ...options,
    } );
    const text = await resp.text();
    let body;
    try { body = JSON.parse( text ); } catch { body = text; }
    if ( ! resp.ok ) {
        const msg = body?.message || body?.code || text;
        throw new Error( `HTTP ${resp.status} — ${path} — ${msg}` );
    }
    return body;
}

const [,, cmd, ...rest] = process.argv;

try {
    switch ( cmd ) {
        case 'test': {
            const user = await api( '/wp/v2/users/me' );
            console.log( `Connexion OK — utilisateur : ${user.name} (${user.slug})` );
            console.log( `Site : ${WP_URL}` );
            break;
        }
        case 'pages': {
            const pages = await api( '/wp/v2/pages?per_page=20&status=any' );
            if ( ! pages.length ) { console.log( 'Aucune page.' ); break; }
            for ( const p of pages ) {
                console.log( `[${p.id}] ${p.title?.rendered ?? p.title}  (${p.status})` );
            }
            break;
        }
        case 'creer-page': {
            const titre = rest.join(' ');
            if ( ! titre ) { console.error( 'Usage : creer-page <titre>' ); process.exit(1); }
            const p = await api( '/wp/v2/pages', {
                method: 'POST',
                body:   JSON.stringify( { title: titre, status: 'draft' } ),
            } );
            console.log( `Page créée : id=${p.id}  "${p.title?.rendered ?? titre}"` );
            break;
        }
        case 'medias': {
            const medias = await api( '/wp/v2/media?per_page=20' );
            if ( ! medias.length ) { console.log( 'Aucun média.' ); break; }
            for ( const m of medias ) {
                console.log( `[${m.id}] ${m.title?.rendered ?? m.slug}  ${m.source_url}` );
            }
            break;
        }
        default:
            console.error( `Commande inconnue : "${cmd || ''}"\n` );
            console.log( `Commandes : test | pages | creer-page <titre> | medias` );
            process.exit(1);
    }
} catch ( err ) {
    console.error( 'Erreur :', err.message );
    process.exit(1);
}

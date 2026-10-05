#!/usr/bin/env node
/**
 * Connecteur Tutor LMS — nosreussites.org
 *
 * Authentification : Application Password WordPress (WP_USER / WP_APP_PASSWORD dans .env)
 *
 * Commandes :
 *   cours                                            — liste les cours
 *   creer-cours   <titre>                            — crée un cours (brouillon)
 *   creer-rubrique <cours_id> <titre>                — crée une rubrique (topic)
 *   creer-lecon   <rubrique_id> <cours_id> <titre>   — crée une leçon
 *   creer-quiz    <rubrique_id> <cours_id> <titre>   — crée un quiz
 *   creer-question <quiz_id> <enoncé>                — crée une question (options : --type --points --reponses)
 *
 * Exemples :
 *   node tutor.mjs cours
 *   node tutor.mjs creer-cours "Comment faire une omelette"
 *   node tutor.mjs creer-rubrique 875 "Ingrédients"
 *   node tutor.mjs creer-lecon 910 875 "Choisir ses œufs"
 *   node tutor.mjs creer-quiz 910 875 "Quiz sur les ingrédients"
 *   node tutor.mjs creer-question 920 "Combien d'œufs par personne ?" --type=single_choice --points=2 \
 *     --reponses='[{"texte":"1","correct":false},{"texte":"2","correct":true},{"texte":"3","correct":false}]'
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// --- chargement .env ---------------------------------------------------------

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

// --- helpers -----------------------------------------------------------------

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

function parseArgs( argv ) {
    const args   = [];
    const flags  = {};
    for ( const a of argv ) {
        if ( a.startsWith( '--' ) ) {
            const [k, ...v] = a.slice(2).split( '=' );
            flags[ k ] = v.join( '=' ) || true;
        } else {
            args.push( a );
        }
    }
    return { args, flags };
}

// --- commandes ---------------------------------------------------------------

async function listCours() {
    const cours = await api( '/wp/v2/courses?per_page=20&status=any' );
    if ( ! cours.length ) { console.log( 'Aucun cours.' ); return; }
    for ( const c of cours ) {
        console.log( `[${c.id}] ${c.title?.rendered ?? c.title}  (${c.status})` );
        console.log( `      ${WP_URL}/?post_type=courses&p=${c.id}` );
    }
}

async function creerCours( titre ) {
    if ( ! titre ) { console.error( 'Usage : creer-cours <titre>' ); process.exit(1); }
    const c = await api( '/wp/v2/courses', {
        method: 'POST',
        body:   JSON.stringify( { title: titre, status: 'draft' } ),
    } );
    console.log( `Cours créé : id=${c.id}  titre="${c.title?.rendered ?? titre}"` );
    console.log( `Lien : ${WP_URL}/?post_type=courses&p=${c.id}` );
}

async function creerRubrique( coursId, titre ) {
    if ( ! coursId || ! titre ) {
        console.error( 'Usage : creer-rubrique <cours_id> <titre>' ); process.exit(1);
    }
    const t = await api( '/nr-tutor/v1/topics', {
        method: 'POST',
        body:   JSON.stringify( { cours_id: Number(coursId), titre } ),
    } );
    console.log( `Rubrique créée : id=${t.id}  "${t.titre}"  (cours ${t.cours_id})` );
}

async function creerLecon( rubriqueId, coursId, titre, flags = {} ) {
    if ( ! rubriqueId || ! coursId || ! titre ) {
        console.error( 'Usage : creer-lecon <rubrique_id> <cours_id> <titre>' ); process.exit(1);
    }
    const l = await api( '/nr-tutor/v1/lessons', {
        method: 'POST',
        body:   JSON.stringify( {
            rubrique_id: Number(rubriqueId),
            cours_id:    Number(coursId),
            titre,
            contenu: flags.contenu ?? '',
        } ),
    } );
    console.log( `Leçon créée : id=${l.id}  "${l.titre}"  (rubrique ${l.rubrique_id})` );
}

async function creerQuiz( rubriqueId, coursId, titre ) {
    if ( ! rubriqueId || ! coursId || ! titre ) {
        console.error( 'Usage : creer-quiz <rubrique_id> <cours_id> <titre>' ); process.exit(1);
    }
    const q = await api( '/nr-tutor/v1/quizzes', {
        method: 'POST',
        body:   JSON.stringify( {
            rubrique_id: Number(rubriqueId),
            cours_id:    Number(coursId),
            titre,
        } ),
    } );
    console.log( `Quiz créé : id=${q.id}  "${q.titre}"  (rubrique ${q.rubrique_id})` );
}

async function creerQuestion( quizId, enonce, flags = {} ) {
    if ( ! quizId || ! enonce ) {
        console.error( 'Usage : creer-question <quiz_id> <enoncé> [--type=...] [--points=N] [--reponses=\'[...]\']' );
        process.exit(1);
    }
    let reponses = [];
    if ( flags.reponses ) {
        try { reponses = JSON.parse( flags.reponses ); } catch {
            console.error( 'Option --reponses : JSON invalide.' ); process.exit(1);
        }
    }
    const q = await api( '/nr-tutor/v1/questions', {
        method: 'POST',
        body:   JSON.stringify( {
            quiz_id:  Number(quizId),
            enonce,
            type:     flags.type    ?? 'single_choice',
            points:   Number( flags.points ?? 1 ),
            reponses,
        } ),
    } );
    console.log( `Question créée : id=${q.id}  type=${q.type}  ordre=${q.ordre}  (quiz ${q.quiz_id})` );
    console.log( `  "${q.enonce}"` );
}

// --- dispatch ----------------------------------------------------------------

const { args, flags } = parseArgs( process.argv.slice(2) );
const cmd = args[0];

try {
    switch ( cmd ) {
        case 'cours':
            await listCours();
            break;
        case 'creer-cours':
            await creerCours( args.slice(1).join(' ') );
            break;
        case 'creer-rubrique':
            await creerRubrique( args[1], args.slice(2).join(' ') );
            break;
        case 'creer-lecon':
        case 'creer-leçon':
            await creerLecon( args[1], args[2], args.slice(3).join(' '), flags );
            break;
        case 'creer-quiz':
            await creerQuiz( args[1], args[2], args.slice(3).join(' ') );
            break;
        case 'creer-question':
            await creerQuestion( args[1], args.slice(2).join(' '), flags );
            break;
        default:
            console.error( `Commande inconnue : "${cmd || ''}"\n` );
            console.log( `Commandes disponibles :
  cours
  creer-cours   <titre>
  creer-rubrique <cours_id> <titre>
  creer-lecon   <rubrique_id> <cours_id> <titre>  [--contenu="..."]
  creer-quiz    <rubrique_id> <cours_id> <titre>
  creer-question <quiz_id> <enoncé>  [--type=single_choice] [--points=1] [--reponses='[...]']` );
            process.exit(1);
    }
} catch ( err ) {
    console.error( 'Erreur :', err.message );
    process.exit(1);
}

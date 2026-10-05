<?php
/**
 * Plugin Name: NR Tutor REST
 * Description: Endpoints REST pour créer rubriques, leçons, quiz et questions Tutor LMS via Application Password WordPress.
 * Version:     1.1.0
 * Author:      Lycée Victor Laloux
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

add_action( 'rest_api_init', 'nr_tutor_register_routes' );

function nr_tutor_register_routes() {

    register_rest_route( 'nr-tutor/v1', '/topics', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'nr_tutor_create_topic',
        'permission_callback' => 'nr_tutor_permission',
        'args'                => [
            'titre'    => [ 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ],
            'cours_id' => [ 'required' => true,  'type' => 'integer' ],
            'ordre'    => [ 'required' => false, 'type' => 'integer', 'default' => 0 ],
        ],
    ] );

    register_rest_route( 'nr-tutor/v1', '/lessons', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'nr_tutor_create_lesson',
        'permission_callback' => 'nr_tutor_permission',
        'args'                => [
            'titre'       => [ 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ],
            'rubrique_id' => [ 'required' => true,  'type' => 'integer' ],
            'cours_id'    => [ 'required' => true,  'type' => 'integer' ],
            'contenu'     => [ 'required' => false, 'type' => 'string',  'default' => '' ],
            'ordre'       => [ 'required' => false, 'type' => 'integer', 'default' => 0 ],
        ],
    ] );

    register_rest_route( 'nr-tutor/v1', '/quizzes', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'nr_tutor_create_quiz',
        'permission_callback' => 'nr_tutor_permission',
        'args'                => [
            'titre'       => [ 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ],
            'rubrique_id' => [ 'required' => true,  'type' => 'integer' ],
            'cours_id'    => [ 'required' => true,  'type' => 'integer' ],
            'ordre'       => [ 'required' => false, 'type' => 'integer', 'default' => 0 ],
        ],
    ] );

    register_rest_route( 'nr-tutor/v1', '/questions', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'nr_tutor_create_question',
        'permission_callback' => 'nr_tutor_permission',
        'args'                => [
            'quiz_id' => [ 'required' => true,  'type' => 'integer' ],
            'enonce'  => [ 'required' => true,  'type' => 'string',  'sanitize_callback' => 'sanitize_text_field' ],
            'type'    => [
                'required' => false,
                'type'     => 'string',
                'default'  => 'single_choice',
                'enum'     => [
                    'true_false', 'single_choice', 'multiple_choice',
                    'open_ended', 'fill_in_the_blank', 'short_answer',
                    'matching', 'image_answering', 'ordering',
                ],
            ],
            'points'   => [ 'required' => false, 'type' => 'integer', 'default' => 1 ],
            'ordre'    => [ 'required' => false, 'type' => 'integer', 'default' => 0 ],
            'reponses' => [ 'required' => false, 'type' => 'array',   'default' => [] ],
        ],
    ] );
}

// --------------------------------------------------------------------------
// Permission : admin via Application Password WordPress
// --------------------------------------------------------------------------

function nr_tutor_permission( WP_REST_Request $request ) {
    if ( ! is_user_logged_in() ) {
        return new WP_Error( 'rest_forbidden', 'Authentification requise.', [ 'status' => 401 ] );
    }
    if ( ! current_user_can( 'manage_options' ) ) {
        return new WP_Error( 'rest_forbidden', 'Droits insuffisants (manage_options requis).', [ 'status' => 403 ] );
    }
    return true;
}

// --------------------------------------------------------------------------
// Rubrique (topic)
// --------------------------------------------------------------------------

function nr_tutor_create_topic( WP_REST_Request $request ) {
    $cours_id = (int) $request->get_param( 'cours_id' );

    $cours = get_post( $cours_id );
    if ( ! $cours || $cours->post_type !== 'courses' ) {
        return new WP_Error( 'invalid_course', 'Cours introuvable (id=' . $cours_id . ').', [ 'status' => 404 ] );
    }

    $topic_id = wp_insert_post( [
        'post_type'   => 'topics',
        'post_title'  => $request->get_param( 'titre' ),
        'post_status' => 'publish',
        'post_parent' => $cours_id,
        'menu_order'  => (int) $request->get_param( 'ordre' ),
    ], true );

    if ( is_wp_error( $topic_id ) ) {
        return new WP_Error( 'insert_failed', $topic_id->get_error_message(), [ 'status' => 500 ] );
    }

    // Méta attendue par Tutor LMS pour relier rubrique et cours
    update_post_meta( $topic_id, '_tutor_course_id_for_topic', $cours_id );

    return new WP_REST_Response( [
        'id'       => $topic_id,
        'titre'    => get_the_title( $topic_id ),
        'cours_id' => $cours_id,
        'lien'     => get_permalink( $topic_id ),
    ], 201 );
}

// --------------------------------------------------------------------------
// Leçon (lesson)
// --------------------------------------------------------------------------

function nr_tutor_create_lesson( WP_REST_Request $request ) {
    $rubrique_id = (int) $request->get_param( 'rubrique_id' );
    $cours_id    = (int) $request->get_param( 'cours_id' );

    $rubrique = get_post( $rubrique_id );
    if ( ! $rubrique || $rubrique->post_type !== 'topics' ) {
        return new WP_Error( 'invalid_topic', 'Rubrique introuvable (id=' . $rubrique_id . ').', [ 'status' => 404 ] );
    }

    $lesson_id = wp_insert_post( [
        'post_type'    => 'lesson',
        'post_title'   => $request->get_param( 'titre' ),
        'post_content' => wp_kses_post( $request->get_param( 'contenu' ) ),
        'post_status'  => 'publish',
        'post_parent'  => $rubrique_id,
        'menu_order'   => (int) $request->get_param( 'ordre' ),
    ], true );

    if ( is_wp_error( $lesson_id ) ) {
        return new WP_Error( 'insert_failed', $lesson_id->get_error_message(), [ 'status' => 500 ] );
    }

    update_post_meta( $lesson_id, '_tutor_course_id_for_lesson', $cours_id );

    return new WP_REST_Response( [
        'id'          => $lesson_id,
        'titre'       => get_the_title( $lesson_id ),
        'rubrique_id' => $rubrique_id,
        'cours_id'    => $cours_id,
    ], 201 );
}

// --------------------------------------------------------------------------
// Quiz
// --------------------------------------------------------------------------

function nr_tutor_create_quiz( WP_REST_Request $request ) {
    $rubrique_id = (int) $request->get_param( 'rubrique_id' );
    $cours_id    = (int) $request->get_param( 'cours_id' );

    $rubrique = get_post( $rubrique_id );
    if ( ! $rubrique || $rubrique->post_type !== 'topics' ) {
        return new WP_Error( 'invalid_topic', 'Rubrique introuvable (id=' . $rubrique_id . ').', [ 'status' => 404 ] );
    }

    $quiz_id = wp_insert_post( [
        'post_type'   => 'tutor_quiz',
        'post_title'  => $request->get_param( 'titre' ),
        'post_status' => 'publish',
        'post_parent' => $rubrique_id,
        'menu_order'  => (int) $request->get_param( 'ordre' ),
    ], true );

    if ( is_wp_error( $quiz_id ) ) {
        return new WP_Error( 'insert_failed', $quiz_id->get_error_message(), [ 'status' => 500 ] );
    }

    // Paramètres par défaut attendus par Tutor LMS
    update_post_meta( $quiz_id, '_tutor_quiz_option', [
        'feedback_mode'                      => 'retry',
        'attempts_allowed'                   => 0,
        'passing_grade'                      => 80,
        'max_questions_for_answer'           => 10,
        'quiz_auto_start'                    => 0,
        'question_layout_view'               => '',
        'questions_order'                    => 'rand',
        'hide_question_number_overview'      => 0,
        'short_answer_characters_limit'      => 200,
        'open_ended_answer_characters_limit' => 500,
    ] );
    update_post_meta( $quiz_id, '_tutor_course_id_for_quiz', $cours_id );

    return new WP_REST_Response( [
        'id'          => $quiz_id,
        'titre'       => get_the_title( $quiz_id ),
        'rubrique_id' => $rubrique_id,
        'cours_id'    => $cours_id,
    ], 201 );
}

// --------------------------------------------------------------------------
// Question
// --------------------------------------------------------------------------

function nr_tutor_create_question( WP_REST_Request $request ) {
    global $wpdb;

    $quiz_id = (int) $request->get_param( 'quiz_id' );
    $quiz    = get_post( $quiz_id );
    if ( ! $quiz || $quiz->post_type !== 'tutor_quiz' ) {
        return new WP_Error( 'invalid_quiz', 'Quiz introuvable (id=' . $quiz_id . ').', [ 'status' => 404 ] );
    }

    $table_q = $wpdb->prefix . 'tutor_quiz_questions';
    if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_q ) ) !== $table_q ) {
        return new WP_Error(
            'no_table',
            'Table ' . $table_q . ' introuvable. Tutor LMS est-il activé ?',
            [ 'status' => 500 ]
        );
    }

    $ordre = (int) $request->get_param( 'ordre' );
    if ( $ordre === 0 ) {
        $max   = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COALESCE(MAX(question_order),0) FROM {$table_q} WHERE quiz_id = %d",
            $quiz_id
        ) );
        $ordre = $max + 1;
    }

    $wpdb->insert( $table_q, [
        'quiz_id'              => $quiz_id,
        'question_title'       => $request->get_param( 'enonce' ),
        'question_description' => '',
        'answer_explanation'   => '',
        'question_type'        => $request->get_param( 'type' ),
        'question_mark'        => (int) $request->get_param( 'points' ),
        'question_order'       => $ordre,
    ] );

    if ( $wpdb->last_error ) {
        return new WP_Error( 'insert_failed', $wpdb->last_error, [ 'status' => 500 ] );
    }

    $question_id = $wpdb->insert_id;

    $reponses = $request->get_param( 'reponses' );
    if ( ! empty( $reponses ) ) {
        nr_tutor_insert_answers( $question_id, $reponses );
    }

    return new WP_REST_Response( [
        'id'      => $question_id,
        'enonce'  => $request->get_param( 'enonce' ),
        'type'    => $request->get_param( 'type' ),
        'quiz_id' => $quiz_id,
        'ordre'   => $ordre,
    ], 201 );
}

// --------------------------------------------------------------------------
// Réponses d'une question
// --------------------------------------------------------------------------

function nr_tutor_insert_answers( int $question_id, array $reponses ) {
    global $wpdb;

    $table_a = $wpdb->prefix . 'tutor_quiz_question_answers';
    if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table_a ) ) !== $table_a ) {
        return;
    }

    $ordre = 1;
    foreach ( $reponses as $r ) {
        if ( empty( $r['texte'] ) ) {
            continue;
        }
        $wpdb->insert( $table_a, [
            'belongs_question_id'   => $question_id,
            'belongs_question_type' => '',
            'answer_title'          => sanitize_text_field( $r['texte'] ),
            'is_correct'            => ( ! empty( $r['correct'] ) ) ? '1' : '0',
            'image_id'              => 0,
            'answer_two_gap_match'  => '',
            'answer_view_format'    => $r['format'] ?? 'text',
            'answer_settings'       => '',
            'answer_order'          => $ordre++,
        ] );
    }
}

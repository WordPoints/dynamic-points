<?php

/**
 * Extension functions.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Register extension's app when the Extensions registry is initialized.
 *
 * @since 1.0.0
 *
 * @WordPress\action wordpoints_init_app-extensions
 * @WordPress\action wordpoints_init_app-modules For back-compat.
 *
 * @param WordPoints_App $extensions The extensions app.
 */
function wordpoints_dynamic_points_modules_app_init( $extensions ) {

	$apps = $extensions->sub_apps();

	$apps->register( 'dynamic_points', 'WordPoints_App' );
}

/**
 * Register sub apps when the Dynamic Points app is initialized.
 *
 * @since 1.0.0
 *
 * @WordPress\action wordpoints_init_app-extensions-dynamic_points
 * @WordPress\action wordpoints_init_app-modules-dynamic_points For back-compat.
 *
 * @param WordPoints_App $app The Dynamic Points app.
 */
function wordpoints_dynamic_points_apps_init( $app ) {

	$apps = $app->sub_apps();

	$apps->register( 'rounding_methods', 'WordPoints_Class_Registry' );
}

/**
 * Register rounding methods when the rounding method registry is initialized.
 *
 * @since 1.0.0
 *
 * @WordPress\action wordpoints_init_app_registry-extensions-dynamic_points-rounding_methods
 * @WordPress\action wordpoints_init_app_registry-modules-dynamic_points-rounding_methods
 *                   For back-compat.
 *
 * @param WordPoints_Class_RegistryI $rounding_methods The rounding methods registry.
 */
function wordpoints_dynamic_points_rounding_methods_init( $rounding_methods ) {

	$rounding_methods->register( 'nearest', 'WordPoints_Dynamic_Points_Rounding_Method_Nearest' );
	$rounding_methods->register( 'up', 'WordPoints_Dynamic_Points_Rounding_Method_Up' );
	$rounding_methods->register( 'down', 'WordPoints_Dynamic_Points_Rounding_Method_Down' );
}

/**
 * Register hook extension when the extension registry is initialized.
 *
 * @since 1.0.0
 *
 * @WordPress\action wordpoints_init_app_registry-hooks-extensions
 *
 * @param WordPoints_Class_Registry_Persistent $extensions The extension registry.
 */
function wordpoints_dynamic_points_hook_extensions_init( $extensions ) {

	$extensions->register( 'dynamic_points', 'WordPoints_Dynamic_Points_Hook_Extension' );
}

/**
 * Filters the value of the points column in the How To Get Points shortcode.
 *
 * @since 1.0.0
 *
 * @WordPress\filter wordpoints_htgp_shortcode_reaction_points
 *
 * @param string|false              $points   The value of the points column.
 * @param WordPoints_Hook_ReactionI $reaction The reaction object.
 *
 * @return string|false The value of the points column.
 */
function wordpoints_dynamic_points_htgp_shortcode_reaction_points(
	$points,
	$reaction
) {

	if ( $points ) {
		return $points;
	}

	$settings = $reaction->get_meta( 'dynamic_points' );

	if ( ! $settings ) {
		return $points;
	}

	$arg_titles = wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy(
		$reaction->get_event_slug()
		, $settings['arg']
	);

	if ( ! $arg_titles ) {
		return __( 'Dynamic', 'wordpoints-dynamic-points' );
	}

	$arg = implode( __( ' » ', 'wordpoints-dynamic-points' ), $arg_titles );

	if ( isset( $settings['multiply_by'] ) && 1.0 !== (float) $settings['multiply_by'] ) {

		$text = sprintf(
			// translators: 1. Value the points are based on; 2. Number.
			__( 'Calculated from %1$s multiplied by %2$s.', 'wordpoints-dynamic-points' )
			, $arg
			, $settings['multiply_by']
		);

	} else {

		$text = sprintf(
			// translators: Value the points are based on, e.g., "Post » Comment Count".
			__( 'Calculated from %s.', 'wordpoints-dynamic-points' )
			, $arg
		);
	}

	if ( isset( $settings['min'] ) ) {
		$text .= ' ';
		$text .= sprintf(
			// translators: Minimum number of points awarded.
			__( 'Minimum: %s.', 'wordpoints-dynamic-points' )
			, $settings['min']
		);
	}

	if ( isset( $settings['max'] ) ) {
		$text .= ' ';
		$text .= sprintf(
			// translators: Maximum number of points awarded.
			__( 'Maximum: %s.', 'wordpoints-dynamic-points' )
			, $settings['max']
		);
	}

	return $text;
}

/**
 * The list of arg titles from a hook arg hierarchy.
 *
 * @since 1.0.0
 *
 * @param string   $event_slug The slug of the event the args relate to.
 * @param string[] $hierarchy  The hierarchy of arg slugs, in descending order.
 *
 * @return string[]|false The arg titles, or false on failure.
 */
function wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy(
	$event_slug,
	$hierarchy
) {

	$event_arg = wordpoints_hooks()
		->get_sub_app( 'events' )
		->get_sub_app( 'args' )
		->get( $event_slug, $hierarchy[0] );

	if ( ! $event_arg ) {
		return false;
	}

	$event_args = new WordPoints_Hook_Event_Args( array( $event_arg ) );

	$arg_titles = array();

	$arg = null;

	foreach ( $hierarchy as $slug ) {

		if ( ! $event_args->descend( $slug ) ) {
			return false;
		}

		$is_related_entity = $arg instanceof WordPoints_Entity_Relationship;

		$arg = $event_args->get_current();

		// We skip the titles of related entities to avoid "Author » User", etc.
		if ( $is_related_entity ) {
			continue;
		}

		$arg_titles[] = $arg->get_title();
	}

	return $arg_titles;
}

// EOF

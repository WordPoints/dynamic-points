<?php

/**
 * Admin-side functions.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Register admin scripts and styles.
 *
 * @since 1.0.0
 *
 * @WordPress\action admin_init
 */
function wordpoints_dynamic_points_register_admin_scripts() {

	$version = WordPoints_Modules::get_data( __FILE__, 'version' );
	$assets_url = wordpoints_modules_url( '/assets', dirname( __FILE__ ) );
	$suffix = SCRIPT_DEBUG ? '' : '.min';
	$manifested_suffix = SCRIPT_DEBUG ? '.manifested' : '.min';

	// CSS

	wp_register_style(
		'wordpoints-dynamic-points-hooks-admin'
		, "{$assets_url}/css/hooks{$suffix}.css"
		, array( 'wordpoints-hooks-admin' )
		, $version
	);

	$styles = wp_styles();
	$styles->add_data( 'wordpoints-dynamic-points-hooks-admin', 'rtl', 'replace' );

	if ( $suffix ) {
		$styles->add_data( 'wordpoints-dynamic-points-hooks-admin', 'suffix', $suffix );
	}

	// JS

	wp_register_script(
		'wordpoints-hooks-extension-dynamic_points'
		, "{$assets_url}/js/hooks/extension{$manifested_suffix}.js"
		, array( 'wordpoints-hooks-views' )
		, $version
	);

	wp_script_add_data(
		'wordpoints-hooks-extension-dynamic_points'
		, 'wordpoints-templates'
		, '
			<script type="text/template" id="tmpl-wordpoints-dynamic-points-hook-settings">
				<button class="button-secondary enable">' . esc_html__( 'Or, Enable Dynamic Points', 'wordpoints-dynamic-points' ) . '</button>
				<button class="button-secondary disable">' . esc_html__( 'Disable Dynamic Points', 'wordpoints-dynamic-points' ) . '</button>
				<div class="wordpoints-dynamic-points-settings"></div>
			</script>
		'
	);
}

/**
 * Enqueue admin scripts and styles for the hooks.
 *
 * @since 1.0.0
 *
 * @WordPress\action wordpoints_admin_points_events_head
 */
function wordpoints_dynamic_points_enqueue_admin_hook_scripts() {
	wp_enqueue_style( 'wordpoints-dynamic-points-hooks-admin' );
}

// EOF

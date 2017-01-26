<?php

/**
 * Module functions.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

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

// EOF

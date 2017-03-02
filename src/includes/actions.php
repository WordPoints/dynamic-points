<?php

/**
 * Hook up the module's actions and filters.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

add_action( 'wordpoints_init_app_registry-hooks-extensions', 'wordpoints_dynamic_points_hook_extensions_init' );

add_filter( 'wordpoints_htgp_shortcode_reaction_points', 'wordpoints_dynamic_points_htgp_shortcode_reaction_points', 10, 2 );

// EOF

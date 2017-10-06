<?php

/**
 * Hook up the extension's admin-side actions and filters.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

add_action( 'admin_init', 'wordpoints_dynamic_points_register_admin_scripts' );
add_action( 'wordpoints_admin_points_events_head', 'wordpoints_dynamic_points_enqueue_admin_hook_scripts' );

// EOF

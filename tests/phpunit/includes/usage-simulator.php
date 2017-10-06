<?php

/**
 * Simulate extension usage.
 *
 * Used by the install/uninstall tests to provide a more full test of whether
 * everything is properly deleted on uninstall. Uninstalling a fresh install is
 * important, but cleaning up the little things is also important. Doing this little
 * dance here helps us to make sure we're doing that.
 *
 * @package WordPoints_Dynamic_Points\PHPUnit
 * @since 1.0.0
 */

/**
 * Simulate extension usage.
 *
 * Only available from the extension uninstall usage simulator.
 *
 * @since 1.0.0
 */
function wordpoints_dynamic_points_tests_simulate_usage() {

	wordpoints_add_points_type( array( 'name' => 'Points' ) );

	wordpoints_hooks()->get_reaction_store( 'points' )->create_reaction(
		array(
			'event' => 'post_publish\\post',
			'reactor' => 'points',
			'target' => array( 'post\\post', 'author', 'user' ),
			'points_type' => 'points',
			'points' => 0,
			'log_text' => 'Testing.',
			'description' => 'Testing.',
			'dynamic_points' => array(
				'arg' => array( 'post\\post', 'comment_count' ),
			),
		)
	);
}

if ( is_multisite() ) {

	$blog_ids = get_sites( array( 'fields' => 'ids', 'number' => 0 ) );

	$original_blog_id = get_current_blog_id();

	foreach ( $blog_ids as $_blog_id ) {

		// We use $_blog_id instead of $blog_id, because this is in the global scope.
		switch_to_blog( $_blog_id );

		wordpoints_dynamic_points_tests_simulate_usage();
	}

	switch_to_blog( $original_blog_id );

	// See https://wordpress.stackexchange.com/a/89114/27757
	unset( $GLOBALS['_wp_switched_stack'] );
	$GLOBALS['switched'] = false;

} else {

	wordpoints_dynamic_points_tests_simulate_usage();
}

// EOF

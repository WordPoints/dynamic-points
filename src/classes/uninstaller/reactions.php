<?php

/**
 * Reactions uninstaller class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.1
 */

/**
 * Uninstalls the dynamic points settings for the points reactions.
 *
 * @since 1.0.1
 */
class WordPoints_Dynamic_Points_Uninstaller_Reactions
	implements WordPoints_RoutineI {

	/**
	 * @since 1.0.1
	 */
	public function run() {

		$reaction_store = wordpoints_hooks()->get_reaction_store( 'points' );

		if ( ! $reaction_store ) {
			return;
		}

		foreach ( $reaction_store->get_reactions() as $reaction ) {

			$settings = $reaction->get_meta( 'dynamic_points' );

			if ( ! $settings ) {
				continue;
			}

			if ( 0 === $reaction->get_meta( 'points' ) ) {
				$reaction->update_meta( 'disable', true );
			}

			$reaction->delete_meta( 'dynamic_points' );
		}
	}
}

// EOF

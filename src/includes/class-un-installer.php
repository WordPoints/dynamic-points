<?php

/**
 * Un/installer class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Un/installs the module.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Un_Installer extends WordPoints_Un_Installer_Base {

	/**
	 * @since 1.0.0
	 */
	protected $type = 'module';

	/**
	 * @since 1.0.0
	 */
	protected function uninstall_network() {

		$this->uninstall_dynamic_points_reactions();

		parent::uninstall_network();
	}

	/**
	 * @since 1.0.0
	 */
	protected function uninstall_site() {

		$this->uninstall_dynamic_points_reactions();

		parent::uninstall_site();
	}

	/**
	 * @since 1.0.0
	 */
	protected function uninstall_single() {

		$this->uninstall_dynamic_points_reactions();

		parent::uninstall_single();
	}

	/**
	 * Uninstalls the dynamic points settings for the points reactions.
	 *
	 * @since 1.0.0
	 */
	protected function uninstall_dynamic_points_reactions() {

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

return 'WordPoints_Dynamic_Points_Un_Installer';

// EOF

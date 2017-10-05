<?php

/**
 * Un/installer class.
 *
 * @package WordPoints_Dynamic_Points
 * @since 1.0.0
 * @deprecated 1.0.1
 */

_deprecated_file( __FILE__, '1.0.1' );

/**
 * Un/installs the module.
 *
 * @since 1.0.0
 * @deprecated 1.0.1
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

		$routine = new WordPoints_Dynamic_Points_Uninstaller_Reactions();
		$routine->run();
	}
}

return 'WordPoints_Dynamic_Points_Un_Installer';

// EOF

<?php

/**
 * Installable class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.1
 */

/**
 * The installable object for this extension.
 *
 * @since 1.0.1
 */
class WordPoints_Dynamic_Points_Installable
	extends WordPoints_Installable_Extension {

	/**
	 * @since 1.0.1
	 */
	protected function get_uninstall_routine_factories() {

		$factories   = parent::get_uninstall_routine_factories();
		$factories[] = new WordPoints_Uninstaller_Factory(
			array(
				'universal' => array(
					'WordPoints_Dynamic_Points_Uninstaller_Reactions',
				),
			)
		);

		return $factories;
	}
}

// EOF

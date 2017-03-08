<?php

/**
 * Uninstall test case.
 *
 * @package WordPoints_Dynamic_Points\PHPUnit
 * @since 1.0.0
 */

/**
 * Tests uninstalling the module.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Uninstall_Test
	extends WordPoints_PHPUnit_TestCase_Module_Uninstall {

	/**
	 * Test installation and uninstallation.
	 *
	 * @since 1.0.0
	 */
	public function test_uninstall() {

		$this->uninstall();

		// Check that everything with this module's prefix has been uninstalled.
		$this->assertUninstalledPrefix( 'dynamic_points' );

		if ( ! getenv( 'WORDPOINTS_ONLY_UNINSTALL_MODULE' ) ) {
			return;
		}

		$reactions = wordpoints_hooks()
			->get_reaction_store( 'points' )
			->get_reactions();

		$this->assertCount( 1, $reactions );

		$reaction = $reactions[0];

		$this->assertFalse( $reaction->get_meta( 'dynamic_points' ) );
		$this->assertTrue( $reaction->get_meta( 'disable' ) );
	}
}

// EOF

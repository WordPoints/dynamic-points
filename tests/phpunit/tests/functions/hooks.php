<?php

/**
 * Test case for the hooks functions.
 *
 * @package WordPoints_Dynamic_Points\PHPUnit\Tests
 * @since 1.0.0
 */

/**
 * Tests the hooks functions.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Hooks_Functions_Test
	extends WordPoints_PHPUnit_TestCase_Hooks {

	/**
	 * Test the extension registration function.
	 *
	 * @since 1.0.0
	 *
	 * @covers ::wordpoints_dynamic_points_hook_extensions_init
	 */
	public function test_extensions() {

		$this->mock_apps();

		$extensions = new WordPoints_Class_Registry_Persistent();

		wordpoints_dynamic_points_hook_extensions_init( $extensions );

		$this->assertTrue( $extensions->is_registered( 'dynamic_points' ) );
	}
}

// EOF

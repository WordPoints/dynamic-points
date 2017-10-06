<?php

/**
 * Test case for the apps functions.
 *
 * @package WordPoints_Dynamic_Points\PHPUnit\Tests
 * @since 1.0.0
 */

/**
 * Tests the apps functions.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Apps_Functions_Test
	extends WordPoints_PHPUnit_TestCase {

	/**
	 * Test the extension app registration function.
	 *
	 * @since 1.0.0
	 *
	 * @covers ::wordpoints_dynamic_points_modules_app_init
	 */
	public function test_extensions() {

		$this->mock_apps();

		$extensions = new WordPoints_App( 'extensions' );

		wordpoints_dynamic_points_modules_app_init( $extensions );

		$this->assertTrue( $extensions->sub_apps()->is_registered( 'dynamic_points' ) );
	}

	/**
	 * Test the extension apps registration function.
	 *
	 * @since 1.0.0
	 *
	 * @covers ::wordpoints_dynamic_points_apps_init
	 */
	public function test_extension_apps() {

		$this->mock_apps();

		$apps = new WordPoints_App( 'dynamic_points' );

		wordpoints_dynamic_points_apps_init( $apps );

		$this->assertTrue( $apps->sub_apps()->is_registered( 'rounding_methods' ) );
	}

	/**
	 * Test the rounding method registration function.
	 *
	 * @since 1.0.0
	 *
	 * @covers ::wordpoints_dynamic_points_rounding_methods_init
	 */
	public function test_rounding_methods() {

		$this->mock_apps();

		$rounding_methods = new WordPoints_Class_Registry();

		wordpoints_dynamic_points_rounding_methods_init( $rounding_methods );

		$this->assertTrue( $rounding_methods->is_registered( 'nearest' ) );
		$this->assertTrue( $rounding_methods->is_registered( 'up' ) );
		$this->assertTrue( $rounding_methods->is_registered( 'down' ) );
	}

	/**
	 * Test the hook extension registration function.
	 *
	 * @since 1.0.0
	 *
	 * @covers ::wordpoints_dynamic_points_hook_extensions_init
	 */
	public function test_hook_extensions() {

		$this->mock_apps();

		$extensions = new WordPoints_Class_Registry_Persistent();

		wordpoints_dynamic_points_hook_extensions_init( $extensions );

		$this->assertTrue( $extensions->is_registered( 'dynamic_points' ) );
	}
}

// EOF

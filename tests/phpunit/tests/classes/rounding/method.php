<?php

/**
 * Test case for WordPoints_Dynamic_Points_Rounding_Method.
 *
 * @package WordPoints_Dynamic_Points\PHPUnit
 * @since   1.0.0
 */

/**
 * Tests WordPoints_Dynamic_Points_Rounding_Method.
 *
 * @since 1.0.0
 *
 * @covers WordPoints_Dynamic_Points_Rounding_Method
 */
class WordPoints_Dynamic_Points_Rounding_Method_Test
	extends WordPoints_PHPUnit_TestCase {

	/**
	 * Tests that get slug returns the slug that the class was constructed with.
	 *
	 * @since 1.0.0
	 */
	public function test_get_slug() {

		$slug = 'test_slug';

		/** @var WordPoints_Dynamic_Points_Rounding_Method $stub */
		$stub = $this->getMockForAbstractClass(
			'WordPoints_Dynamic_Points_Rounding_Method'
			, array( $slug )
		);

		$this->assertSame( $slug, $stub->get_slug() );
	}
}

// EOF

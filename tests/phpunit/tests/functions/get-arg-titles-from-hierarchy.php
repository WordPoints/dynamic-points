<?php

/**
 * Test case for wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy().
 *
 * @package WordPoints_Dynamic_Points\PHPUnit\Tests
 * @since 1.0.0
 */

/**
 * Tests the wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy() function.
 *
 * @since 1.0.0
 *
 * @covers ::wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy
 */
class WordPoints_Dynamic_Points_Get_Hook_Arg_Titles_From_Hierarchy_Test
	extends WordPoints_PHPUnit_TestCase_Points {

	/**
	 * Test that it returns the list of arg titles.
	 *
	 * @since 1.0.0
	 */
	public function test_gets_arg_titles() {

		$result = wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy(
			'post_publish\\post'
			, array( 'post\\post', 'author', 'user' )
		);

		$this->assertSame( array( 'Post', 'Author' ), $result );
	}

	/**
	 * Test that it returns false if the event is unknown.
	 *
	 * @since 1.0.0
	 */
	public function test_invalid_event() {

		$result = wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy(
			'invalid'
			, array( 'post\\post', 'author', 'user' )
		);

		$this->assertFalse( $result );
	}

	/**
	 * Test that it returns false if the arg hierarchy is unknown.
	 *
	 * @since 1.0.0
	 */
	public function test_invalid_hierarchy() {

		$result = wordpoints_dynamic_points_get_hook_arg_titles_from_hierarchy(
			'post_publish\\post'
			, array( 'post\\post', 'author', 'invalid' )
		);

		$this->assertFalse( $result );
	}
}

// EOF

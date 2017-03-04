<?php

/**
 * Test case for wordpoints_dynamic_points_htgp_shortcode_reaction_points().
 *
 * @package WordPoints_Dynamic_Points\PHPUnit\Tests
 * @since 1.0.0
 */

/**
 * Tests the wordpoints_dynamic_points_htgp_shortcode_reaction_points() function.
 *
 * @since 1.0.0
 *
 * @covers ::wordpoints_dynamic_points_htgp_shortcode_reaction_points
 */
class WordPoints_Dynamic_Points_HGTP_Shortcode_Reaction_Points_Test
	extends WordPoints_PHPUnit_TestCase_Points {

	/**
	 * Test that it returns a string based on the arg hierarchy.
	 *
	 * @since 1.0.0
	 */
	public function test_describes_arg_hierarchy() {

		$points = 0;
		$reaction = $this->create_points_reaction(
			array(
				'event' => 'post_publish\\post',
				'target' => array( 'post\\post', 'author', 'user' ),
				'dynamic_points' => array(
					'arg' => array( 'post\\post', 'comment_count' ),
				),
			)
		);

		$this->assertIsReaction( $reaction );

		$result = wordpoints_dynamic_points_htgp_shortcode_reaction_points(
			$points
			, $reaction
		);

		$this->assertSame( 'Calculated from Post » Comment Count', $result );
	}

	/**
	 * Test that it just returns the points amount if it is set.
	 *
	 * @since 1.0.0
	 */
	public function test_returns_points_if_set() {

		$points = 10;
		$reaction = $this->create_points_reaction(
			array(
				'event' => 'post_publish\\post',
				'target' => array( 'post\\post', 'author', 'user' ),
				'dynamic_points' => array(
					'arg' => array( 'post\\post', 'comment_count' ),
				),
			)
		);

		$this->assertIsReaction( $reaction );

		$result = wordpoints_dynamic_points_htgp_shortcode_reaction_points(
			$points
			, $reaction
		);

		$this->assertSame( $points, $result );
	}

	/**
	 * Test that it just returns the points amount if the settings aren't set.
	 *
	 * @since 1.0.0
	 */
	public function test_returns_points_if_no_settings() {

		$points = 0;
		$reaction = $this->create_points_reaction(
			array(
				'event' => 'post_publish\\post',
				'target' => array( 'post\\post', 'author', 'user' ),
			)
		);

		$this->assertIsReaction( $reaction );

		$result = wordpoints_dynamic_points_htgp_shortcode_reaction_points(
			$points
			, $reaction
		);

		$this->assertSame( $points, $result );
	}

	/**
	 * Test that it returns a generic string if the arg hierarchy isn't known.
	 *
	 * @since 1.0.0
	 */
	public function test_returns_generic_string_if_hierarchy_invalid() {

		$points = 0;
		$reaction = $this->create_points_reaction(
			array(
				'event' => 'post_publish\\post',
				'target' => array( 'post\\post', 'author', 'user' ),
			)
		);

		$this->assertIsReaction( $reaction );

		$reaction->add_meta(
			'dynamic_points'
			, array( 'arg' => array( 'post\\post', 'something' ) )
		);

		$result = wordpoints_dynamic_points_htgp_shortcode_reaction_points(
			$points
			, $reaction
		);

		$this->assertSame( 'Dynamic', $result );
	}
}

// EOF
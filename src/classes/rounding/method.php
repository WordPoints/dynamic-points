<?php

/**
 * Rounding method class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Bootstrap for representing a rounding method.
 *
 * @since 1.0.0
 */
abstract class WordPoints_Dynamic_Points_Rounding_Method
	implements WordPoints_Dynamic_Points_Rounding_MethodI {

	/**
	 * The slug of this rounding method.
	 *
	 * @since 1.0.0
	 *
	 * @var string
	 */
	protected $slug;

	/**
	 * @since 1.0.0
	 *
	 * @param string $slug The slug of this rounding method.
	 */
	public function __construct( $slug ) {
		$this->slug = $slug;
	}

	/**
	 * @since 1.0.0
	 */
	public function get_slug() {
		return $this->slug;
	}
}

// EOF

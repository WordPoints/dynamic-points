<?php

/**
 * Rounding method interface.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Defines the public API for a rounding method.
 *
 * @since 1.0.0
 */
interface WordPoints_Dynamic_Points_Rounding_MethodI {

	/**
	 * Get the slug of this rounding method.
	 *
	 * @since 1.0.0
	 *
	 * @return string The rounding method's slug.
	 */
	public function get_slug();

	/**
	 * Get the title of this rounding method.
	 *
	 * @since 1.0.0
	 *
	 * @return string The title of the rounding method.
	 */
	public function get_title();

	/**
	 * Round a value using this method.
	 *
	 * @since 1.0.0
	 *
	 * @param float $value The value to round.
	 *
	 * @return int The value rounded to integer precision.
	 */
	public function round( $value );
}

// EOF

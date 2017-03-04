<?php

/**
 * Nearest rounding method class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Method of rounding that rounds to the nearest integer (half up).
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Rounding_Method_Nearest
	extends WordPoints_Dynamic_Points_Rounding_Method {

	/**
	 * @since 1.0.0
	 */
	public function get_title() {
		return __( 'To Nearest Integer', 'wordpoints-dynamic-points' );
	}

	/**
	 * @since 1.0.0
	 */
	public function round( $value ) {
		return (int) round( $value );
	}
}

// EOF

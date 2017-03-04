<?php

/**
 * Down rounding method class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Method of rounding that rounds down to the previous integer.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Rounding_Method_Down
	extends WordPoints_Dynamic_Points_Rounding_Method {

	/**
	 * @since 1.0.0
	 */
	public function get_title() {
		return __( 'Always Down', 'wordpoints-dynamic-points' );
	}

	/**
	 * @since 1.0.0
	 */
	public function round( $value ) {
		return (int) floor( $value );
	}
}

// EOF

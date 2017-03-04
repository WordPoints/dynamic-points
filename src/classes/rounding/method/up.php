<?php

/**
 * Up rounding method class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Method of rounding that rounds up to the next integer.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Rounding_Method_Up
	extends WordPoints_Dynamic_Points_Rounding_Method {

	/**
	 * @since 1.0.0
	 */
	public function get_title() {
		return __( 'Always Up', 'wordpoints-dynamic-points' );
	}

	/**
	 * @since 1.0.0
	 */
	public function round( $value ) {
		return (int) ceil( $value );
	}
}

// EOF

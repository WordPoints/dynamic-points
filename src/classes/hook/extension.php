<?php

/**
 * Dynamic points hook extension class.
 *
 * @package WordPoints_Dynamic_Points
 * @since   1.0.0
 */

/**
 * Filters the number of points to award dynamically based on event args.
 *
 * @since 1.0.0
 */
class WordPoints_Dynamic_Points_Hook_Extension
	extends WordPoints_Hook_Extension
	implements WordPoints_Hook_UI_Script_Data_ProviderI {

	/**
	 * The rounding methods class registry.
	 *
	 * @since 1.0.0
	 *
	 * @var WordPoints_Class_RegistryI
	 */
	protected $rounding_methods;

	/**
	 * Whether the settings require that a rounding method be set.
	 *
	 * @since 1.0.0
	 *
	 * @var bool
	 */
	protected $requires_rounding;

	/**
	 * @since 1.0.0
	 */
	public function __construct( $slug ) {

		parent::__construct( $slug );

		$this->rounding_methods = wordpoints_extension( 'dynamic_points' )
			->get_sub_app( 'rounding_methods' );

		add_action(
			'wordpoints_points_hook_reactor_points_to_award'
			, array( $this, 'filter_points_to_award' )
			, 10
			, 2
		);
	}

	/**
	 * @since 1.0.0
	 */
	protected function validate_extension_settings( $settings ) {

		if ( ! is_array( $settings ) ) {

			$this->validator->add_error(
				__(
					'Dynamic points settings do not match expected format.'
					, 'wordpoints-dynamic-points'
				)
			);

			return null;
		}

		if ( empty( $settings['arg'] ) ) {

			$this->validator->add_error(
				__(
					'You must specify an arg to calculate the points based on.',
					'wordpoints-dynamic-points'
				)
				, 'arg'
			);

			return null;
		}

		$this->requires_rounding = false;

		$this->validator->push_field( 'arg' );

		$settings['arg'] = $this->validate_dynamic_points_arg(
			$settings['arg']
		);

		$this->validator->pop_field();

		if ( ! $settings['arg'] ) {
			return null;
		}

		if ( isset( $settings['multiply_by'] ) ) {

			$settings['multiply_by'] = $this->validate_dynamic_points_multiply_by(
				$settings['multiply_by']
			);

			if ( ! $settings['multiply_by'] ) {
				unset( $settings['multiply_by'] );
			}
		}

		if ( isset( $settings['rounding_method'] ) ) {

			$settings['rounding_method'] = $this->validate_dynamic_points_rounding_method(
				$settings['rounding_method']
			);

			if ( ! $settings['rounding_method'] ) {
				unset( $settings['rounding_method'] );
			}

		} elseif ( $this->requires_rounding ) {

			$this->validator->add_error(
				__(
					'A rounding method must be set when awarding dynamic points based on a decimal number value.'
					, 'wordpoints-dynamic-points'
				)
			);
		}

		if ( isset( $settings['min'] ) ) {

			$settings['min'] = $this->validate_dynamic_points_min(
				$settings['min']
			);

			if ( ! $settings['min'] ) {
				unset( $settings['min'] );
			}
		}

		if ( isset( $settings['max'] ) ) {

			$settings['max'] = $this->validate_dynamic_points_max(
				$settings['max']
				, isset( $settings['min'] ) ? $settings['min'] : null
			);

			if ( ! $settings['max'] ) {
				unset( $settings['max'] );
			}
		}

		return $settings;
	}

	/**
	 * Validate an arg as being usable for generating the dynamic points value.
	 *
	 * @since 1.0.0
	 *
	 * @param string[] $arg_hierarchy The arg hierarchy.
	 *
	 * @return string[]|false The validated arg hierarchy, or false.
	 */
	protected function validate_dynamic_points_arg( $arg_hierarchy ) {

		if ( ! is_array( $arg_hierarchy ) ) {

			$this->validator->add_error(
				__(
					'Dynamic points settings do not match expected format.',
					'wordpoints-dynamic-points'
				)
			);

			return false;
		}

		$arg = $this->event_args->get_from_hierarchy( $arg_hierarchy );

		if ( ! $arg ) {
			return false;
		}

		if ( ! $this->can_get_number_from_arg( $arg ) ) {

			$this->validator->add_error(
				__(
					'Dynamic points cannot be awarded based on the specified attribute.',
					'wordpoints-dynamic-points'
				)
			);

			return false;
		}

		return $arg_hierarchy;
	}

	/**
	 * Validate the value to multiply by.
	 *
	 * @since 1.0.0
	 *
	 * @param string $multiply_by The value to multiply by.
	 *
	 * @return string|false The value to multiply by, or false.
	 */
	protected function validate_dynamic_points_multiply_by( $multiply_by ) {

		if ( ! is_int( $multiply_by ) ) {
			$multiply_by = filter_var( $multiply_by, FILTER_VALIDATE_FLOAT );
		}

		if ( empty( $multiply_by ) ) {

			$this->validator->add_error(
				__( 'Value to multiply by must be a number other than zero.', 'wordpoints-dynamic-points' )
				, 'multiply_by'
			);

			return false;
		}

		if ( round( $multiply_by ) !== (float) $multiply_by ) {
			$this->requires_rounding = true;
		}

		return $multiply_by;
	}

	/**
	 * Validate a rounding method.
	 *
	 * @since 1.0.0
	 *
	 * @param string $rounding_method The rounding method.
	 *
	 * @return string|false The validated rounding method, or false.
	 */
	protected function validate_dynamic_points_rounding_method( $rounding_method ) {

		if ( ! is_string( $rounding_method ) ) {

			$this->validator->add_error(
				__( 'Invalid rounding method.', 'wordpoints-dynamic-points' )
				, 'rounding_method'
			);

			return false;
		}

		if ( ! $this->rounding_methods->is_registered( $rounding_method ) ) {

			$this->validator->add_error(
				__( 'Invalid rounding method.', 'wordpoints-dynamic-points' )
				, 'rounding_method'
			);

			return false;
		}

		return $rounding_method;
	}

	/**
	 * Validate the minimum number of points to award.
	 *
	 * @since 1.0.0
	 *
	 * @param int $min The minimum.
	 *
	 * @return int|false The minimum, or false.
	 */
	protected function validate_dynamic_points_min( $min ) {

		if ( false === wordpoints_int( $min ) ) {

			$this->validator->add_error(
				__( 'Minimum must be an integer.', 'wordpoints-dynamic-points' )
				, 'min'
			);

			return false;
		}

		return $min;
	}

	/**
	 * Validate the maximum number of points to award.
	 *
	 * @since 1.0.0
	 *
	 * @param int $max The maximum.
	 * @param int $min The minimum, if set.
	 *
	 * @return int|false The maximum, or false.
	 */
	protected function validate_dynamic_points_max( $max, $min = null ) {

		if ( false === wordpoints_int( $max ) ) {

			$this->validator->add_error(
				__( 'Maximum must be an integer.', 'wordpoints-dynamic-points' )
				, 'max'
			);

			return false;
		}

		if ( isset( $min ) && $min >= $max ) {

			$this->validator->add_error(
				__(
					'The maximum must be more than the minimum.'
					, 'wordpoints-dynamic-points'
				)
				, 'max'
			);

			return false;
		}

		return $max;
	}

	/**
	 * Check that we can get a number from an arg to use as the dynamic points value.
	 *
	 * @since 1.0.0
	 *
	 * @param WordPoints_EntityishI $arg The arg object.
	 *
	 * @return bool Whether this arg can be used to generate the dynamic value.
	 */
	protected function can_get_number_from_arg( $arg ) {

		if ( ! $arg instanceof WordPoints_Entity_Attr ) {
			return false;
		}

		$data_type = $arg->get_data_type();

		if ( 'integer' === $data_type ) {
			return true;
		}

		if ( 'decimal_number' === $data_type ) {
			$this->requires_rounding = true;
			return true;
		}

		return false;
	}

	/**
	 * @since 1.0.0
	 */
	public function should_hit( WordPoints_Hook_Fire $fire ) {
		return true;
	}

	/**
	 * @since 1.0.0
	 */
	public function get_ui_script_data() {

		$rounding_methods = array();

		/** @var WordPoints_Dynamic_Points_Rounding_MethodI $rounding_method */
		foreach ( $this->rounding_methods->get_all() as $slug => $rounding_method ) {
			$rounding_methods[ $slug ] = $rounding_method->get_title();
		}

		return array(
			'arg_label' => __(
				'Calculate Points Based On'
				, 'wordpoints-dynamic-points'
			),
			'multiply_by_label' => __( 'Multiply By', 'wordpoints-dynamic-points' ),
			'rounding_method_label' => __( 'Rounding Method', 'wordpoints-dynamic-points' ),
			'rounding_methods' => $rounding_methods,
			'min_label' => __( 'Minimum To Award', 'wordpoints-dynamic-points' ),
			'max_label' => __( 'Maximum To Award', 'wordpoints-dynamic-points' ),
		);
	}

	/**
	 * Filters the number of points to award.
	 *
	 * @since 1.0.0
	 *
	 * @WordPress\filter wordpoints_points_hook_reactor_points_to_award Added by the
	 *                                                                  constructor.
	 *
	 * @param int                  $points The number of points to award.
	 * @param WordPoints_Hook_Fire $fire   The hook fire object.
	 *
	 * @return int The number of points to award.
	 */
	public function filter_points_to_award( $points, WordPoints_Hook_Fire $fire ) {

		if ( $points ) {
			return $points;
		}

		$settings = $fire->reaction->get_meta( 'dynamic_points' );

		if ( ! $settings ) {
			return $points;
		}

		return $this->calculate_points_value( $settings, $fire );
	}

	/**
	 * Calculates a points value based on the current hit and the extension settings.
	 *
	 * @since 1.0.0
	 *
	 * @param array                $settings The extension settings.
	 * @param WordPoints_Hook_Fire $fire     The fire object for the current hit.
	 *
	 * @return int The number of points.
	 */
	protected function calculate_points_value(
		array $settings,
		WordPoints_Hook_Fire $fire
	) {

		$points = 0;

		$arg = $fire->event_args->get_from_hierarchy( $settings['arg'] );

		$value = $arg->get_the_value();

		if ( empty( $value ) ) {
			$value = $points;
		}

		if ( isset( $settings['multiply_by'] ) ) {
			$value = $value * $settings['multiply_by'];
		}

		if ( isset( $settings['rounding_method'] ) ) {

			$rounding_method = $this->rounding_methods->get(
				$settings['rounding_method']
			);

			if ( ! $rounding_method instanceof WordPoints_Dynamic_Points_Rounding_MethodI ) {
				return $points;
			}

			$value = $rounding_method->round( $value );
		}

		if ( false !== wordpoints_int( $value ) ) {
			$points = $value;
		}

		if ( isset( $settings['min'] ) && $points < $settings['min'] ) {
			$points = $settings['min'];
		}

		if ( isset( $settings['max'] ) && $points > $settings['max'] ) {
			$points = $settings['max'];
		}

		return $points;
	}
}

// EOF

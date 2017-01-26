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
	 * @since 1.0.0
	 */
	protected $slug = 'dynamic_points';

	/**
	 * @since 1.0.0
	 */
	public function __construct() {

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

		$this->validator->push_field( 'arg' );

		$settings['arg'] = $this->validate_dynamic_points_arg(
			$settings['arg']
		);

		$this->validator->pop_field();

		if ( ! $settings['arg'] ) {
			return null;
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

		if ( 'integer' !== $arg->get_data_type() ) {
			return false;
		}

		return true;
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
		return array(
			'arg_label' => __(
				'Calculate Points Based On'
				, 'wordpoints-dynamic-points'
			),
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

		if ( false !== wordpoints_int( $value ) ) {
			$points = $value;
		}

		return $points;
	}
}

// EOF

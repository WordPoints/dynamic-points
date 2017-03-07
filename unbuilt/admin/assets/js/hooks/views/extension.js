/**
 * @summary Dynamic Points hook extension view object.
 *
 * @since 1.0.0
 *
 * @module
 */

var Base = wp.wordpoints.hooks.view.Base,
	Fields = wp.wordpoints.hooks.Fields,
	Args = wp.wordpoints.hooks.Args,
	$ = Backbone.$,
	DynamicPoints;

/**
 * wp.wordpoints.hooks.view.DynamicPoints
 *
 * @since 1.0.0
 *
 * @class
 * @augments Backbone.View
 * @augments wp.wordpoints.hooks.view.Base
 */
DynamicPoints = Base.extend({

	/**
	 * @since 1.0.0
	 */
	namespace: 'dynamic-points',

	/**
	 * @since 1.0.0
	 */
	className: 'wordpoints-dynamic-points',

	/**
	 * @summary The template to build the settings form from.
	 *
	 * @since 1.0.0
	 *
	 * @member {function}
	 */
	template: wp.wordpoints.hooks.template( 'dynamic-points-hook-settings' ),

	/**
	 * @since 1.0.0
	 */
	events:  function () {

		var events = {
			'click .enable':  'enable',
			'click .disable': 'disable',
			'change [name="dynamic_points[arg]"]': 'maybeShowRoundingForArg'
		};

		/*
		 * Use feature detection to determine whether we should use the `input`
		 * event. Input is preferred but lacks support in legacy browsers.
		 */
		if ( 'oninput' in document.createElement( 'input' ) ) {
			events['input [name="dynamic_points[multiply_by]"]'] = 'maybeShowRoundingForMultiplyBy';
		} else {
			events['keyup [name="dynamic_points[multiply_by]"]'] = 'maybeShowRoundingForMultiplyBy';
		}

		return events;
	},

	/**
	 * @summary The arg hierarchies.
	 *
	 * @since 1.0.0
	 *
	 * @member {Arg[][]}
	 */
	hierarchies: [],

	/**
	 * @summary The extension settings element object.
	 *
	 * @since 1.0.0
	 *
	 * @member {jQuery}
	 */
	$settings: null,

	/**
	 * @summary The input element for the regular points.
	 *
	 * @since 1.0.0
	 *
	 * @member {jQuery}
	 */
	$regularPointsInput: null,

	/**
	 * @summary The wrapper element for the field for the regular points.
	 *
	 * @since 1.0.0
	 *
	 * @member {jQuery}
	 */
	$regularPoints: null,

	/**
	 * @since 1.0.0
	 */
	initialize: function ( options ) {

		this.hierarchies = options.hierarchies;

		this.$regularPointsInput = this.reaction.$settings.find( '[name=points]' );
		this.$regularPoints = this.$regularPointsInput.closest( 'p.description' );

		this.on( 'render', this.maybeShowRounding );
	},

	/**
	 * @summary Renders the view.
	 *
	 * @since 1.0.0
	 *
	 * @return {DynamicPoints} The view object.
	 */
	render: function () {

		var options = [];

		_.each( this.hierarchies, function ( hierarchy ) {
			options.push( {
				label: Args.buildHierarchyHumanId( hierarchy ),
				value: _.pluck( _.pluck( hierarchy, 'attributes' ), 'slug' ).join( ',' )
			} );
		});

		var value = this.reaction.model.get( [ 'dynamic_points', 'arg' ] );

		if ( _.isArray( value ) ) {
			value = value.join( ',' );
		}

		var argField = Fields.create(
			'dynamic_points[arg]'
			, value
			, {
				type: 'select',
				options: options,
				label: this.model.data.arg_label
			}
		);

		var multiplyByField = Fields.create(
			'dynamic_points[multiply_by]'
			, this.reaction.model.get( [ 'dynamic_points', 'multiply_by' ] )
			, {
				type: 'number',
				'default': 1,
				label: this.model.data.multiply_by_label
			}
		);

		var roundingMethodField = Fields.create(
			'dynamic_points[rounding_method]'
			, this.model.get( ['dynamic_points', 'rounding_method'] )
			, {
				type: 'select',
				options: this.model.data.rounding_methods,
				label: this.model.data.rounding_method_label
			}
		);

		roundingMethodField = $(
			'<div class="wordpoints-dynamic-points-rounding-method"></div>'
		)
			.html( roundingMethodField )[0].outerHTML;

		var minField = Fields.create(
			'dynamic_points[min]'
			, this.reaction.model.get( [ 'dynamic_points', 'min' ] )
			, {
				type: 'number',
				label: this.model.data.min_label
			}
		);

		var maxField = Fields.create(
			'dynamic_points[max]'
			, this.reaction.model.get( [ 'dynamic_points', 'max' ] )
			, {
				type: 'number',
				label: this.model.data.max_label
			}
		);

		this.$el.html( this.template() );

		this.$settings = this.$( '.wordpoints-dynamic-points-settings' );

		this.$settings.html(
			argField + multiplyByField + roundingMethodField + minField + maxField
		);

		if ( value && 0 === this.reaction.model.get( 'points' ) ) {
			this.$settings.show();
			this.$( '.enable' ).hide();
			this.$( '.disable' ).show();
			this.$regularPoints.hide();
		}

		this.trigger( 'render' );

		return this;
	},

	/**
	 * @summary Shows the extensions's settings.
	 *
	 * @since 1.0.0
	 */
	enable: function ( event ) {

		event.preventDefault();

		this.$settings.show();
		this.$( '.enable' ).hide();
		this.$( '.disable' ).show().focus();
		this.$regularPoints.hide();
		this.$regularPointsInput.val( 0 );
		this.reaction.lockOpen();
	},

	/**
	 * @summary Hides the extension's settings.
	 *
	 * @since 1.0.0
	 */
	disable: function ( event ) {

		event.preventDefault();

		this.$settings.hide();
		this.$( '.disable' ).hide();
		this.$( '.enable' ).show();
		this.$regularPoints.show();
		this.$regularPointsInput.focus();
		this.reaction.lockOpen();
	},

	/**
	 * @summary Displays the rounding field.
	 *
	 * @since 1.0.0
	 */
	showRounding: function () {
		this.$( '.wordpoints-dynamic-points-rounding-method' ).show();
	},

	/**
	 * @summary Hides the rounding field.
	 *
	 * @since 1.0.0
	 */
	hideRounding: function () {
		this.$( '.wordpoints-dynamic-points-rounding-method' ).hide();
	},

	/**
	 * @summary Checks if the rounding field should be shown.
	 *
	 * @since 1.0.0
	 *
	 * @return {boolean} True if the field should be shown, false otherwise.
	 */
	shouldShowRounding: function () {

		return (
			this.shouldShowRoundingForMultiplyBy()
			|| this.shouldShowRoundingForArg()
		);
	},

	/**
	 * @summary Displays the rounding field, if it should be shown.
	 *
	 * If rounding is not necessary, it ensures that the field is hidden.
	 *
	 * @since 1.0.0
	 */
	maybeShowRounding: function () {

		if ( this.shouldShowRounding() ) {
			this.showRounding();
		} else {
			this.hideRounding();
		}
	},

	/**
	 * @summary Checks if the rounding should be shown based on the selected arg.
	 *
	 * @since 1.0.0
	 *
	 * @return {boolean} Whether the rounding field should be shown for this arg.
	 */
	shouldShowRoundingForArg: function () {

		var $argSelector = this.$( '[name="dynamic_points[arg]"]' );

		var args = Args.getArgsFromHierarchy(
			$argSelector.val().split( ',' )
			, this.model.get( 'event' )
		);

		var arg = args[ args.length - 1 ];

		return arg.get( 'data_type' ) === 'decimal_number';
	},

	/**
	 * @summary Shows the rounding field only if necessary based on the selected arg.
	 *
	 * If rounding is not necessary, it ensures that the field is hidden.
	 *
	 * @since 1.0.0
	 */
	maybeShowRoundingForArg: function () {

		if ( this.shouldShowRoundingForArg() ) {
			this.showRounding();
		} else if ( ! this.shouldShowRoundingForMultiplyBy() ) {
			this.hideRounding();
		}
	},

	/**
	 * @summary Checks if the rounding should be shown for the value to multiply by.
	 *
	 * @since 1.0.0
	 *
	 * @return {boolean} Whether rounding should be shown for the multiply by value.
	 */
	shouldShowRoundingForMultiplyBy: function () {

		var $multiplyBy = this.$( '[name="dynamic_points[multiply_by]"]' );

		return -1 !== $multiplyBy.val().indexOf( '.' );
	},

	/**
	 * @summary Shows the rounding only if necessary based on the multiply by value.
	 *
	 * If rounding is not necessary, it ensures that the field is hidden.
	 *
	 * @since 1.0.0
	 */
	maybeShowRoundingForMultiplyBy:  function () {

		if ( this.shouldShowRoundingForMultiplyBy() ) {
			this.showRounding();
		} else if ( ! this.shouldShowRoundingForArg() ) {
			this.hideRounding();
		}
	}
});

module.exports = DynamicPoints;

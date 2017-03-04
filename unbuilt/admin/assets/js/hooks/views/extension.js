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
	events:  {
		'click .enable':  'enable',
		'click .disable': 'disable',
		'change [name="dynamic_points[arg]"]': 'maybeShowRounding'
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
	 * The extension settings element object.
	 *
	 * @since 1.0.0
	 *
	 * @member {jQuery}
	 */
	$settings: null,

	/**
	 * The input element for the regular points.
	 *
	 * @since 1.0.0
	 *
	 * @member {jQuery}
	 */
	$regularPointsInput: null,

	/**
	 * The wrapper element for the field for the regular points.
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

		this.listenTo( this.model, 'invalid', this.showValidationErrors );
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

		var field = Fields.create(
			'dynamic_points[arg]'
			, value
			, {
				type: 'select',
				options: options,
				label: this.model.data.arg_label
			}
		);

		this.$el.html( this.template() );

		this.$settings = this.$( '.wordpoints-dynamic-points-settings' );

		this.$settings.html( field );

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
	 * Shows the extensions's settings.
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
	 * Hides the extension's settings.
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
	 * Displays the rounding field.
	 *
	 * @since 1.0.0
	 */
	showRounding: function () {

		var $field = this.$( '.wordpoints-dynamic-points-rounding-method' );

		if ( ! $field.length ) {

			var field = Fields.create(
				'dynamic_points[rounding_method]'
				, this.model.get( ['dynamic_points', 'rounding_method'] )
				, {
					type: 'select',
					options: this.model.data.rounding_methods,
					label: this.model.data.rounding_method_label
				}
			);

			$field = $( '<div class="wordpoints-dynamic-points-rounding-method"></div>' )
				.html( field );

			this.$settings.append( $field );
		}

		$field.show();
	},

	/**
	 * Hides the rounding field.
	 *
	 * @since 1.0.0
	 */
	hideRounding: function () {
		this.$( '.wordpoints-dynamic-points-rounding-method' ).hide();
	},

	/**
	 * Shows the rounding field only if it is necessary.
	 *
	 * If rounding is not necessary, it ensures that the field is hidden.
	 *
	 * @since 1.0.0
	 */
	maybeShowRounding: function () {

		var $argSelector = this.$( '[name="dynamic_points[arg]"]' );

		var args = Args.getArgsFromHierarchy(
			$argSelector.val().split( ',' )
			, this.model.get( 'event' )
		);

		var arg = args[ args.length - 1 ];

		if ( arg.get( 'data_type' ) === 'decimal_number' ) {
			this.showRounding();
		} else {
			this.hideRounding();
		}
	}
});

module.exports = DynamicPoints;

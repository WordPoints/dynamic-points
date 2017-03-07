(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @summary Dynamic Points hook extension controller object.
 *
 * @since 1.0.0
 *
 * @module
 */

var Extension = wp.wordpoints.hooks.controller.Extension,
	Args = wp.wordpoints.hooks.Args,
	DynamicPointsView = wp.wordpoints.hooks.view.DynamicPoints;

/**
 * wp.wordpoints.hooks.extension.DynamicPoints
 *
 * @since 1.0.0
 *
 * @class
 * @augments Backbone.Model
 * @augments wp.wordpoints.hooks.controller.Extension
 */
var DynamicPoints = Extension.extend({

	/**
	 * @since 1.0.0
	 */
	defaults: {
		slug: 'dynamic_points'
	},

	/**
	 * @summary Checks whether a reactor is a points reactor.
	 *
	 * We need to do this, because we only integrate with points reactors.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} reactor The slug of the reactor to check.
	 *
	 * @return {boolean} Whether the reactor is a points reactor or not.
	 */
	isPointsReactor: function ( reactor ) {
		return 'points' === reactor || 'points_legacy' === reactor;
	},

	/**
	 * @since 1.0.0
	 */
	initReaction: function ( reaction ) {

		if ( ! this.isPointsReactor( reaction.model.get( 'reactor' ) ) ) {
			return;
		}

		this.listenTo( reaction, 'render:fields', this.render );
	},

	/**
	 * @summary Gets the arg hierarchies that can be used in dynamic calculations.
	 *
	 * @since 1.0.0
	 *
	 * @param {string} event The event to get the arg hierarchies from.
	 *
	 * @return {Arg[][]} The matching arg hierarchies.
	 */
	getArgHierarchies: function ( event ) {
		return Args.getHierarchiesMatching( {
			event: event,
			end:   function ( arg ) {
				return (
					arg.get( '_type' ) === 'attr'
					&& (
						arg.get( 'data_type' ) === 'integer'
						|| arg.get( 'data_type' ) === 'decimal_number'
					)
				);
			}
		} );
	},

	/**
	 * @summary Renders the extension settings.
	 *
	 * @since 1.0.0
	 *
	 * @param {jQuery}   $el               The element being rendered to.
	 * @param {string}   currentActionType The current action type.
	 * @param {Reaction} reaction          The reaction view object.
	 */
	render: function ( $el, currentActionType, reaction ) {

		var hierarchies = this.getArgHierarchies( reaction.model.get( 'event' ) );

		if ( 0 === hierarchies.length ) {
			return;
		}

		var view = new DynamicPointsView({
			model:       this,
			reaction:    reaction,
			hierarchies: hierarchies
		});

		reaction.$settings.append( view.render().$el );
	},

	/**
	 * @since 1.0.0
	 */
	validateReaction: function ( model, attributes ) {

		if ( attributes.dynamic_points ) {

			if ( 0 === attributes.points ) {

				delete attributes.dynamic_points;

			} else {

				// Make sure the arg hierarchy is an array.
				if (
					attributes.dynamic_points.arg
					&& 'string' === typeof attributes.dynamic_points.arg
				) {

					attributes.dynamic_points.arg = attributes.dynamic_points.arg.split(
						','
					);
				}

				// Delete the rounding method if it isn't needed.
				if ( attributes.dynamic_points.rounding_method ) {

					var multiplyBy = attributes.dynamic_points.multiply_by;

					var arg = Args
						.getArgsFromHierarchy( attributes.dynamic_points.arg )
						.pop();

					if (
						Math.round( multiplyBy ).toString() === multiplyBy
						&& arg.get( 'data_type' ) !== 'decimal_number'
					) {
						delete attributes.dynamic_points.rounding_method;
					}
				}

				// Delete min and max if they aren't set.
				if (
					'undefined' !== typeof attributes.dynamic_points.min
					&& '' === attributes.dynamic_points.min
				) {
					delete attributes.dynamic_points.min;
				}

				if (
					'undefined' !== typeof attributes.dynamic_points.max
					&& '' === attributes.dynamic_points.max
				) {
					delete attributes.dynamic_points.max;
				}
			}
		}
	}

} );

module.exports = DynamicPoints;

},{}],2:[function(require,module,exports){
/**
 * @summary Manifest for the dynamic points extension app.
 *
 * @since 1.0.0
 */

var hooks = wp.wordpoints.hooks;

// Views
hooks.view.DynamicPoints = require( './views/extension.js' );

// Controllers.
hooks.extension.DynamicPoints = require( './controllers/extension.js' );

// Register the extension.
hooks.Extensions.add( new hooks.extension.DynamicPoints() );

// EOF

},{"./controllers/extension.js":1,"./views/extension.js":3}],3:[function(require,module,exports){
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
			'click .wordpoints-dynamic-points-enable':  'enable',
			'click .wordpoints-dynamic-points-disable': 'disable',
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
			this.$( '.wordpoints-dynamic-points-enable' ).hide();
			this.$( '.wordpoints-dynamic-points-disable' ).show();
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
		this.$( '.wordpoints-dynamic-points-enable' ).hide();
		this.$( '.wordpoints-dynamic-points-disable' ).show().focus();
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
		this.$( '.wordpoints-dynamic-points-disable' ).hide();
		this.$( '.wordpoints-dynamic-points-enable' ).show();
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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9jb250cm9sbGVycy9leHRlbnNpb24uanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9leHRlbnNpb24ubWFuaWZlc3QuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy92aWV3cy9leHRlbnNpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAc3VtbWFyeSBEeW5hbWljIFBvaW50cyBob29rIGV4dGVuc2lvbiBjb250cm9sbGVyIG9iamVjdC5cbiAqXG4gKiBAc2luY2UgMS4wLjBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxudmFyIEV4dGVuc2lvbiA9IHdwLndvcmRwb2ludHMuaG9va3MuY29udHJvbGxlci5FeHRlbnNpb24sXG5cdEFyZ3MgPSB3cC53b3JkcG9pbnRzLmhvb2tzLkFyZ3MsXG5cdER5bmFtaWNQb2ludHNWaWV3ID0gd3Aud29yZHBvaW50cy5ob29rcy52aWV3LkR5bmFtaWNQb2ludHM7XG5cbi8qKlxuICogd3Aud29yZHBvaW50cy5ob29rcy5leHRlbnNpb24uRHluYW1pY1BvaW50c1xuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKiBAYXVnbWVudHMgd3Aud29yZHBvaW50cy5ob29rcy5jb250cm9sbGVyLkV4dGVuc2lvblxuICovXG52YXIgRHluYW1pY1BvaW50cyA9IEV4dGVuc2lvbi5leHRlbmQoe1xuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGRlZmF1bHRzOiB7XG5cdFx0c2x1ZzogJ2R5bmFtaWNfcG9pbnRzJ1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBDaGVja3Mgd2hldGhlciBhIHJlYWN0b3IgaXMgYSBwb2ludHMgcmVhY3Rvci5cblx0ICpcblx0ICogV2UgbmVlZCB0byBkbyB0aGlzLCBiZWNhdXNlIHdlIG9ubHkgaW50ZWdyYXRlIHdpdGggcG9pbnRzIHJlYWN0b3JzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHJlYWN0b3IgVGhlIHNsdWcgb2YgdGhlIHJlYWN0b3IgdG8gY2hlY2suXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlYWN0b3IgaXMgYSBwb2ludHMgcmVhY3RvciBvciBub3QuXG5cdCAqL1xuXHRpc1BvaW50c1JlYWN0b3I6IGZ1bmN0aW9uICggcmVhY3RvciApIHtcblx0XHRyZXR1cm4gJ3BvaW50cycgPT09IHJlYWN0b3IgfHwgJ3BvaW50c19sZWdhY3knID09PSByZWFjdG9yO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGluaXRSZWFjdGlvbjogZnVuY3Rpb24gKCByZWFjdGlvbiApIHtcblxuXHRcdGlmICggISB0aGlzLmlzUG9pbnRzUmVhY3RvciggcmVhY3Rpb24ubW9kZWwuZ2V0KCAncmVhY3RvcicgKSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMubGlzdGVuVG8oIHJlYWN0aW9uLCAncmVuZGVyOmZpZWxkcycsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IEdldHMgdGhlIGFyZyBoaWVyYXJjaGllcyB0aGF0IGNhbiBiZSB1c2VkIGluIGR5bmFtaWMgY2FsY3VsYXRpb25zLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byBnZXQgdGhlIGFyZyBoaWVyYXJjaGllcyBmcm9tLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtBcmdbXVtdfSBUaGUgbWF0Y2hpbmcgYXJnIGhpZXJhcmNoaWVzLlxuXHQgKi9cblx0Z2V0QXJnSGllcmFyY2hpZXM6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0cmV0dXJuIEFyZ3MuZ2V0SGllcmFyY2hpZXNNYXRjaGluZygge1xuXHRcdFx0ZXZlbnQ6IGV2ZW50LFxuXHRcdFx0ZW5kOiAgIGZ1bmN0aW9uICggYXJnICkge1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdGFyZy5nZXQoICdfdHlwZScgKSA9PT0gJ2F0dHInXG5cdFx0XHRcdFx0JiYgKFxuXHRcdFx0XHRcdFx0YXJnLmdldCggJ2RhdGFfdHlwZScgKSA9PT0gJ2ludGVnZXInXG5cdFx0XHRcdFx0XHR8fCBhcmcuZ2V0KCAnZGF0YV90eXBlJyApID09PSAnZGVjaW1hbF9udW1iZXInXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgUmVuZGVycyB0aGUgZXh0ZW5zaW9uIHNldHRpbmdzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtqUXVlcnl9ICAgJGVsICAgICAgICAgICAgICAgVGhlIGVsZW1lbnQgYmVpbmcgcmVuZGVyZWQgdG8uXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSAgIGN1cnJlbnRBY3Rpb25UeXBlIFRoZSBjdXJyZW50IGFjdGlvbiB0eXBlLlxuXHQgKiBAcGFyYW0ge1JlYWN0aW9ufSByZWFjdGlvbiAgICAgICAgICBUaGUgcmVhY3Rpb24gdmlldyBvYmplY3QuXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uICggJGVsLCBjdXJyZW50QWN0aW9uVHlwZSwgcmVhY3Rpb24gKSB7XG5cblx0XHR2YXIgaGllcmFyY2hpZXMgPSB0aGlzLmdldEFyZ0hpZXJhcmNoaWVzKCByZWFjdGlvbi5tb2RlbC5nZXQoICdldmVudCcgKSApO1xuXG5cdFx0aWYgKCAwID09PSBoaWVyYXJjaGllcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHZpZXcgPSBuZXcgRHluYW1pY1BvaW50c1ZpZXcoe1xuXHRcdFx0bW9kZWw6ICAgICAgIHRoaXMsXG5cdFx0XHRyZWFjdGlvbjogICAgcmVhY3Rpb24sXG5cdFx0XHRoaWVyYXJjaGllczogaGllcmFyY2hpZXNcblx0XHR9KTtcblxuXHRcdHJlYWN0aW9uLiRzZXR0aW5ncy5hcHBlbmQoIHZpZXcucmVuZGVyKCkuJGVsICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0dmFsaWRhdGVSZWFjdGlvbjogZnVuY3Rpb24gKCBtb2RlbCwgYXR0cmlidXRlcyApIHtcblxuXHRcdGlmICggYXR0cmlidXRlcy5keW5hbWljX3BvaW50cyApIHtcblxuXHRcdFx0aWYgKCAwID09PSBhdHRyaWJ1dGVzLnBvaW50cyApIHtcblxuXHRcdFx0XHRkZWxldGUgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cztcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBNYWtlIHN1cmUgdGhlIGFyZyBoaWVyYXJjaHkgaXMgYW4gYXJyYXkuXG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZ1xuXHRcdFx0XHRcdCYmICdzdHJpbmcnID09PSB0eXBlb2YgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5hcmdcblx0XHRcdFx0KSB7XG5cblx0XHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZyA9IGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnLnNwbGl0KFxuXHRcdFx0XHRcdFx0JywnXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIERlbGV0ZSB0aGUgcm91bmRpbmcgbWV0aG9kIGlmIGl0IGlzbid0IG5lZWRlZC5cblx0XHRcdFx0aWYgKCBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLnJvdW5kaW5nX21ldGhvZCApIHtcblxuXHRcdFx0XHRcdHZhciBtdWx0aXBseUJ5ID0gYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5tdWx0aXBseV9ieTtcblxuXHRcdFx0XHRcdHZhciBhcmcgPSBBcmdzXG5cdFx0XHRcdFx0XHQuZ2V0QXJnc0Zyb21IaWVyYXJjaHkoIGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnIClcblx0XHRcdFx0XHRcdC5wb3AoKTtcblxuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdE1hdGgucm91bmQoIG11bHRpcGx5QnkgKS50b1N0cmluZygpID09PSBtdWx0aXBseUJ5XG5cdFx0XHRcdFx0XHQmJiBhcmcuZ2V0KCAnZGF0YV90eXBlJyApICE9PSAnZGVjaW1hbF9udW1iZXInXG5cdFx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0XHRkZWxldGUgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5yb3VuZGluZ19tZXRob2Q7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gRGVsZXRlIG1pbiBhbmQgbWF4IGlmIHRoZXkgYXJlbid0IHNldC5cblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdCd1bmRlZmluZWQnICE9PSB0eXBlb2YgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5taW5cblx0XHRcdFx0XHQmJiAnJyA9PT0gYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5taW5cblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMubWluO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdCd1bmRlZmluZWQnICE9PSB0eXBlb2YgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5tYXhcblx0XHRcdFx0XHQmJiAnJyA9PT0gYXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5tYXhcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0ZGVsZXRlIGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMubWF4O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cbn0gKTtcblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljUG9pbnRzO1xuIiwiLyoqXG4gKiBAc3VtbWFyeSBNYW5pZmVzdCBmb3IgdGhlIGR5bmFtaWMgcG9pbnRzIGV4dGVuc2lvbiBhcHAuXG4gKlxuICogQHNpbmNlIDEuMC4wXG4gKi9cblxudmFyIGhvb2tzID0gd3Aud29yZHBvaW50cy5ob29rcztcblxuLy8gVmlld3Ncbmhvb2tzLnZpZXcuRHluYW1pY1BvaW50cyA9IHJlcXVpcmUoICcuL3ZpZXdzL2V4dGVuc2lvbi5qcycgKTtcblxuLy8gQ29udHJvbGxlcnMuXG5ob29rcy5leHRlbnNpb24uRHluYW1pY1BvaW50cyA9IHJlcXVpcmUoICcuL2NvbnRyb2xsZXJzL2V4dGVuc2lvbi5qcycgKTtcblxuLy8gUmVnaXN0ZXIgdGhlIGV4dGVuc2lvbi5cbmhvb2tzLkV4dGVuc2lvbnMuYWRkKCBuZXcgaG9va3MuZXh0ZW5zaW9uLkR5bmFtaWNQb2ludHMoKSApO1xuXG4vLyBFT0ZcbiIsIi8qKlxuICogQHN1bW1hcnkgRHluYW1pYyBQb2ludHMgaG9vayBleHRlbnNpb24gdmlldyBvYmplY3QuXG4gKlxuICogQHNpbmNlIDEuMC4wXG4gKlxuICogQG1vZHVsZVxuICovXG5cbnZhciBCYXNlID0gd3Aud29yZHBvaW50cy5ob29rcy52aWV3LkJhc2UsXG5cdEZpZWxkcyA9IHdwLndvcmRwb2ludHMuaG9va3MuRmllbGRzLFxuXHRBcmdzID0gd3Aud29yZHBvaW50cy5ob29rcy5BcmdzLFxuXHQkID0gQmFja2JvbmUuJCxcblx0RHluYW1pY1BvaW50cztcblxuLyoqXG4gKiB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuRHluYW1pY1BvaW50c1xuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuQmFzZVxuICovXG5EeW5hbWljUG9pbnRzID0gQmFzZS5leHRlbmQoe1xuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdG5hbWVzcGFjZTogJ2R5bmFtaWMtcG9pbnRzJyxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRjbGFzc05hbWU6ICd3b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzJyxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgVGhlIHRlbXBsYXRlIHRvIGJ1aWxkIHRoZSBzZXR0aW5ncyBmb3JtIGZyb20uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtmdW5jdGlvbn1cblx0ICovXG5cdHRlbXBsYXRlOiB3cC53b3JkcG9pbnRzLmhvb2tzLnRlbXBsYXRlKCAnZHluYW1pYy1wb2ludHMtaG9vay1zZXR0aW5ncycgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRldmVudHM6ICBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgZXZlbnRzID0ge1xuXHRcdFx0J2NsaWNrIC53b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLWVuYWJsZSc6ICAnZW5hYmxlJyxcblx0XHRcdCdjbGljayAud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1kaXNhYmxlJzogJ2Rpc2FibGUnLFxuXHRcdFx0J2NoYW5nZSBbbmFtZT1cImR5bmFtaWNfcG9pbnRzW2FyZ11cIl0nOiAnbWF5YmVTaG93Um91bmRpbmdGb3JBcmcnXG5cdFx0fTtcblxuXHRcdC8qXG5cdFx0ICogVXNlIGZlYXR1cmUgZGV0ZWN0aW9uIHRvIGRldGVybWluZSB3aGV0aGVyIHdlIHNob3VsZCB1c2UgdGhlIGBpbnB1dGBcblx0XHQgKiBldmVudC4gSW5wdXQgaXMgcHJlZmVycmVkIGJ1dCBsYWNrcyBzdXBwb3J0IGluIGxlZ2FjeSBicm93c2Vycy5cblx0XHQgKi9cblx0XHRpZiAoICdvbmlucHV0JyBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnaW5wdXQnICkgKSB7XG5cdFx0XHRldmVudHNbJ2lucHV0IFtuYW1lPVwiZHluYW1pY19wb2ludHNbbXVsdGlwbHlfYnldXCJdJ10gPSAnbWF5YmVTaG93Um91bmRpbmdGb3JNdWx0aXBseUJ5Jztcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZXZlbnRzWydrZXl1cCBbbmFtZT1cImR5bmFtaWNfcG9pbnRzW211bHRpcGx5X2J5XVwiXSddID0gJ21heWJlU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeSc7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGV2ZW50cztcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgVGhlIGFyZyBoaWVyYXJjaGllcy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEBtZW1iZXIge0FyZ1tdW119XG5cdCAqL1xuXHRoaWVyYXJjaGllczogW10sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFRoZSBleHRlbnNpb24gc2V0dGluZ3MgZWxlbWVudCBvYmplY3QuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkc2V0dGluZ3M6IG51bGwsXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFRoZSBpbnB1dCBlbGVtZW50IGZvciB0aGUgcmVndWxhciBwb2ludHMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkcmVndWxhclBvaW50c0lucHV0OiBudWxsLFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBUaGUgd3JhcHBlciBlbGVtZW50IGZvciB0aGUgZmllbGQgZm9yIHRoZSByZWd1bGFyIHBvaW50cy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEBtZW1iZXIge2pRdWVyeX1cblx0ICovXG5cdCRyZWd1bGFyUG9pbnRzOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uICggb3B0aW9ucyApIHtcblxuXHRcdHRoaXMuaGllcmFyY2hpZXMgPSBvcHRpb25zLmhpZXJhcmNoaWVzO1xuXG5cdFx0dGhpcy4kcmVndWxhclBvaW50c0lucHV0ID0gdGhpcy5yZWFjdGlvbi4kc2V0dGluZ3MuZmluZCggJ1tuYW1lPXBvaW50c10nICk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50cyA9IHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dC5jbG9zZXN0KCAncC5kZXNjcmlwdGlvbicgKTtcblxuXHRcdHRoaXMub24oICdyZW5kZXInLCB0aGlzLm1heWJlU2hvd1JvdW5kaW5nICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFJlbmRlcnMgdGhlIHZpZXcuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtEeW5hbWljUG9pbnRzfSBUaGUgdmlldyBvYmplY3QuXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBvcHRpb25zID0gW107XG5cblx0XHRfLmVhY2goIHRoaXMuaGllcmFyY2hpZXMsIGZ1bmN0aW9uICggaGllcmFyY2h5ICkge1xuXHRcdFx0b3B0aW9ucy5wdXNoKCB7XG5cdFx0XHRcdGxhYmVsOiBBcmdzLmJ1aWxkSGllcmFyY2h5SHVtYW5JZCggaGllcmFyY2h5ICksXG5cdFx0XHRcdHZhbHVlOiBfLnBsdWNrKCBfLnBsdWNrKCBoaWVyYXJjaHksICdhdHRyaWJ1dGVzJyApLCAnc2x1ZycgKS5qb2luKCAnLCcgKVxuXHRcdFx0fSApO1xuXHRcdH0pO1xuXG5cdFx0dmFyIHZhbHVlID0gdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoIFsgJ2R5bmFtaWNfcG9pbnRzJywgJ2FyZycgXSApO1xuXG5cdFx0aWYgKCBfLmlzQXJyYXkoIHZhbHVlICkgKSB7XG5cdFx0XHR2YWx1ZSA9IHZhbHVlLmpvaW4oICcsJyApO1xuXHRcdH1cblxuXHRcdHZhciBhcmdGaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbYXJnXSdcblx0XHRcdCwgdmFsdWVcblx0XHRcdCwge1xuXHRcdFx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRcdFx0b3B0aW9uczogb3B0aW9ucyxcblx0XHRcdFx0bGFiZWw6IHRoaXMubW9kZWwuZGF0YS5hcmdfbGFiZWxcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0dmFyIG11bHRpcGx5QnlGaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbbXVsdGlwbHlfYnldJ1xuXHRcdFx0LCB0aGlzLnJlYWN0aW9uLm1vZGVsLmdldCggWyAnZHluYW1pY19wb2ludHMnLCAnbXVsdGlwbHlfYnknIF0gKVxuXHRcdFx0LCB7XG5cdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHQnZGVmYXVsdCc6IDEsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEubXVsdGlwbHlfYnlfbGFiZWxcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0dmFyIHJvdW5kaW5nTWV0aG9kRmllbGQgPSBGaWVsZHMuY3JlYXRlKFxuXHRcdFx0J2R5bmFtaWNfcG9pbnRzW3JvdW5kaW5nX21ldGhvZF0nXG5cdFx0XHQsIHRoaXMubW9kZWwuZ2V0KCBbJ2R5bmFtaWNfcG9pbnRzJywgJ3JvdW5kaW5nX21ldGhvZCddIClcblx0XHRcdCwge1xuXHRcdFx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRcdFx0b3B0aW9uczogdGhpcy5tb2RlbC5kYXRhLnJvdW5kaW5nX21ldGhvZHMsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEucm91bmRpbmdfbWV0aG9kX2xhYmVsXG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdHJvdW5kaW5nTWV0aG9kRmllbGQgPSAkKFxuXHRcdFx0JzxkaXYgY2xhc3M9XCJ3b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLXJvdW5kaW5nLW1ldGhvZFwiPjwvZGl2Pidcblx0XHQpXG5cdFx0XHQuaHRtbCggcm91bmRpbmdNZXRob2RGaWVsZCApWzBdLm91dGVySFRNTDtcblxuXHRcdHZhciBtaW5GaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbbWluXSdcblx0XHRcdCwgdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoIFsgJ2R5bmFtaWNfcG9pbnRzJywgJ21pbicgXSApXG5cdFx0XHQsIHtcblx0XHRcdFx0dHlwZTogJ251bWJlcicsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEubWluX2xhYmVsXG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdHZhciBtYXhGaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbbWF4XSdcblx0XHRcdCwgdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoIFsgJ2R5bmFtaWNfcG9pbnRzJywgJ21heCcgXSApXG5cdFx0XHQsIHtcblx0XHRcdFx0dHlwZTogJ251bWJlcicsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEubWF4X2xhYmVsXG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMudGVtcGxhdGUoKSApO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3MgPSB0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1zZXR0aW5ncycgKTtcblxuXHRcdHRoaXMuJHNldHRpbmdzLmh0bWwoXG5cdFx0XHRhcmdGaWVsZCArIG11bHRpcGx5QnlGaWVsZCArIHJvdW5kaW5nTWV0aG9kRmllbGQgKyBtaW5GaWVsZCArIG1heEZpZWxkXG5cdFx0KTtcblxuXHRcdGlmICggdmFsdWUgJiYgMCA9PT0gdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoICdwb2ludHMnICkgKSB7XG5cdFx0XHR0aGlzLiRzZXR0aW5ncy5zaG93KCk7XG5cdFx0XHR0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1lbmFibGUnICkuaGlkZSgpO1xuXHRcdFx0dGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtZGlzYWJsZScgKS5zaG93KCk7XG5cdFx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLmhpZGUoKTtcblx0XHR9XG5cblx0XHR0aGlzLnRyaWdnZXIoICdyZW5kZXInICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgU2hvd3MgdGhlIGV4dGVuc2lvbnMncyBzZXR0aW5ncy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRlbmFibGU6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3Muc2hvdygpO1xuXHRcdHRoaXMuJCggJy53b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLWVuYWJsZScgKS5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtZGlzYWJsZScgKS5zaG93KCkuZm9jdXMoKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLmhpZGUoKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzSW5wdXQudmFsKCAwICk7XG5cdFx0dGhpcy5yZWFjdGlvbi5sb2NrT3BlbigpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBIaWRlcyB0aGUgZXh0ZW5zaW9uJ3Mgc2V0dGluZ3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZGlzYWJsZTogZnVuY3Rpb24gKCBldmVudCApIHtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR0aGlzLiRzZXR0aW5ncy5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtZGlzYWJsZScgKS5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtZW5hYmxlJyApLnNob3coKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLnNob3coKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzSW5wdXQuZm9jdXMoKTtcblx0XHR0aGlzLnJlYWN0aW9uLmxvY2tPcGVuKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IERpc3BsYXlzIHRoZSByb3VuZGluZyBmaWVsZC5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRzaG93Um91bmRpbmc6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1yb3VuZGluZy1tZXRob2QnICkuc2hvdygpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBIaWRlcyB0aGUgcm91bmRpbmcgZmllbGQuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0aGlkZVJvdW5kaW5nOiBmdW5jdGlvbiAoKSB7XG5cdFx0dGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtcm91bmRpbmctbWV0aG9kJyApLmhpZGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgQ2hlY2tzIGlmIHRoZSByb3VuZGluZyBmaWVsZCBzaG91bGQgYmUgc2hvd24uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBmaWVsZCBzaG91bGQgYmUgc2hvd24sIGZhbHNlIG90aGVyd2lzZS5cblx0ICovXG5cdHNob3VsZFNob3dSb3VuZGluZzogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeSgpXG5cdFx0XHR8fCB0aGlzLnNob3VsZFNob3dSb3VuZGluZ0ZvckFyZygpXG5cdFx0KTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgRGlzcGxheXMgdGhlIHJvdW5kaW5nIGZpZWxkLCBpZiBpdCBzaG91bGQgYmUgc2hvd24uXG5cdCAqXG5cdCAqIElmIHJvdW5kaW5nIGlzIG5vdCBuZWNlc3NhcnksIGl0IGVuc3VyZXMgdGhhdCB0aGUgZmllbGQgaXMgaGlkZGVuLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdG1heWJlU2hvd1JvdW5kaW5nOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoIHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nKCkgKSB7XG5cdFx0XHR0aGlzLnNob3dSb3VuZGluZygpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLmhpZGVSb3VuZGluZygpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgQ2hlY2tzIGlmIHRoZSByb3VuZGluZyBzaG91bGQgYmUgc2hvd24gYmFzZWQgb24gdGhlIHNlbGVjdGVkIGFyZy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJvdW5kaW5nIGZpZWxkIHNob3VsZCBiZSBzaG93biBmb3IgdGhpcyBhcmcuXG5cdCAqL1xuXHRzaG91bGRTaG93Um91bmRpbmdGb3JBcmc6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciAkYXJnU2VsZWN0b3IgPSB0aGlzLiQoICdbbmFtZT1cImR5bmFtaWNfcG9pbnRzW2FyZ11cIl0nICk7XG5cblx0XHR2YXIgYXJncyA9IEFyZ3MuZ2V0QXJnc0Zyb21IaWVyYXJjaHkoXG5cdFx0XHQkYXJnU2VsZWN0b3IudmFsKCkuc3BsaXQoICcsJyApXG5cdFx0XHQsIHRoaXMubW9kZWwuZ2V0KCAnZXZlbnQnIClcblx0XHQpO1xuXG5cdFx0dmFyIGFyZyA9IGFyZ3NbIGFyZ3MubGVuZ3RoIC0gMSBdO1xuXG5cdFx0cmV0dXJuIGFyZy5nZXQoICdkYXRhX3R5cGUnICkgPT09ICdkZWNpbWFsX251bWJlcic7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFNob3dzIHRoZSByb3VuZGluZyBmaWVsZCBvbmx5IGlmIG5lY2Vzc2FyeSBiYXNlZCBvbiB0aGUgc2VsZWN0ZWQgYXJnLlxuXHQgKlxuXHQgKiBJZiByb3VuZGluZyBpcyBub3QgbmVjZXNzYXJ5LCBpdCBlbnN1cmVzIHRoYXQgdGhlIGZpZWxkIGlzIGhpZGRlbi5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRtYXliZVNob3dSb3VuZGluZ0ZvckFyZzogZnVuY3Rpb24gKCkge1xuXG5cdFx0aWYgKCB0aGlzLnNob3VsZFNob3dSb3VuZGluZ0ZvckFyZygpICkge1xuXHRcdFx0dGhpcy5zaG93Um91bmRpbmcoKTtcblx0XHR9IGVsc2UgaWYgKCAhIHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeSgpICkge1xuXHRcdFx0dGhpcy5oaWRlUm91bmRpbmcoKTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IENoZWNrcyBpZiB0aGUgcm91bmRpbmcgc2hvdWxkIGJlIHNob3duIGZvciB0aGUgdmFsdWUgdG8gbXVsdGlwbHkgYnkuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHJvdW5kaW5nIHNob3VsZCBiZSBzaG93biBmb3IgdGhlIG11bHRpcGx5IGJ5IHZhbHVlLlxuXHQgKi9cblx0c2hvdWxkU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeTogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyICRtdWx0aXBseUJ5ID0gdGhpcy4kKCAnW25hbWU9XCJkeW5hbWljX3BvaW50c1ttdWx0aXBseV9ieV1cIl0nICk7XG5cblx0XHRyZXR1cm4gLTEgIT09ICRtdWx0aXBseUJ5LnZhbCgpLmluZGV4T2YoICcuJyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBTaG93cyB0aGUgcm91bmRpbmcgb25seSBpZiBuZWNlc3NhcnkgYmFzZWQgb24gdGhlIG11bHRpcGx5IGJ5IHZhbHVlLlxuXHQgKlxuXHQgKiBJZiByb3VuZGluZyBpcyBub3QgbmVjZXNzYXJ5LCBpdCBlbnN1cmVzIHRoYXQgdGhlIGZpZWxkIGlzIGhpZGRlbi5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRtYXliZVNob3dSb3VuZGluZ0Zvck11bHRpcGx5Qnk6ICBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoIHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeSgpICkge1xuXHRcdFx0dGhpcy5zaG93Um91bmRpbmcoKTtcblx0XHR9IGVsc2UgaWYgKCAhIHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yQXJnKCkgKSB7XG5cdFx0XHR0aGlzLmhpZGVSb3VuZGluZygpO1xuXHRcdH1cblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHluYW1pY1BvaW50cztcbiJdfQ==

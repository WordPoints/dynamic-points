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

			} else if (
				attributes.dynamic_points.arg
				&& 'string' === typeof attributes.dynamic_points.arg
			) {

				attributes.dynamic_points.arg = attributes.dynamic_points.arg.split(
					','
				);
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

		this.$el.html( this.template() );

		this.$settings = this.$( '.wordpoints-dynamic-points-settings' );

		this.$settings.html( argField + multiplyByField );

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9jb250cm9sbGVycy9leHRlbnNpb24uanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9leHRlbnNpb24ubWFuaWZlc3QuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy92aWV3cy9leHRlbnNpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqXG4gKiBAc3VtbWFyeSBEeW5hbWljIFBvaW50cyBob29rIGV4dGVuc2lvbiBjb250cm9sbGVyIG9iamVjdC5cbiAqXG4gKiBAc2luY2UgMS4wLjBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxudmFyIEV4dGVuc2lvbiA9IHdwLndvcmRwb2ludHMuaG9va3MuY29udHJvbGxlci5FeHRlbnNpb24sXG5cdEFyZ3MgPSB3cC53b3JkcG9pbnRzLmhvb2tzLkFyZ3MsXG5cdER5bmFtaWNQb2ludHNWaWV3ID0gd3Aud29yZHBvaW50cy5ob29rcy52aWV3LkR5bmFtaWNQb2ludHM7XG5cbi8qKlxuICogd3Aud29yZHBvaW50cy5ob29rcy5leHRlbnNpb24uRHluYW1pY1BvaW50c1xuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLk1vZGVsXG4gKiBAYXVnbWVudHMgd3Aud29yZHBvaW50cy5ob29rcy5jb250cm9sbGVyLkV4dGVuc2lvblxuICovXG52YXIgRHluYW1pY1BvaW50cyA9IEV4dGVuc2lvbi5leHRlbmQoe1xuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGRlZmF1bHRzOiB7XG5cdFx0c2x1ZzogJ2R5bmFtaWNfcG9pbnRzJ1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBDaGVja3Mgd2hldGhlciBhIHJlYWN0b3IgaXMgYSBwb2ludHMgcmVhY3Rvci5cblx0ICpcblx0ICogV2UgbmVlZCB0byBkbyB0aGlzLCBiZWNhdXNlIHdlIG9ubHkgaW50ZWdyYXRlIHdpdGggcG9pbnRzIHJlYWN0b3JzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IHJlYWN0b3IgVGhlIHNsdWcgb2YgdGhlIHJlYWN0b3IgdG8gY2hlY2suXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIHJlYWN0b3IgaXMgYSBwb2ludHMgcmVhY3RvciBvciBub3QuXG5cdCAqL1xuXHRpc1BvaW50c1JlYWN0b3I6IGZ1bmN0aW9uICggcmVhY3RvciApIHtcblx0XHRyZXR1cm4gJ3BvaW50cycgPT09IHJlYWN0b3IgfHwgJ3BvaW50c19sZWdhY3knID09PSByZWFjdG9yO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGluaXRSZWFjdGlvbjogZnVuY3Rpb24gKCByZWFjdGlvbiApIHtcblxuXHRcdGlmICggISB0aGlzLmlzUG9pbnRzUmVhY3RvciggcmVhY3Rpb24ubW9kZWwuZ2V0KCAncmVhY3RvcicgKSApICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHRoaXMubGlzdGVuVG8oIHJlYWN0aW9uLCAncmVuZGVyOmZpZWxkcycsIHRoaXMucmVuZGVyICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IEdldHMgdGhlIGFyZyBoaWVyYXJjaGllcyB0aGF0IGNhbiBiZSB1c2VkIGluIGR5bmFtaWMgY2FsY3VsYXRpb25zLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0byBnZXQgdGhlIGFyZyBoaWVyYXJjaGllcyBmcm9tLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtBcmdbXVtdfSBUaGUgbWF0Y2hpbmcgYXJnIGhpZXJhcmNoaWVzLlxuXHQgKi9cblx0Z2V0QXJnSGllcmFyY2hpZXM6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cdFx0cmV0dXJuIEFyZ3MuZ2V0SGllcmFyY2hpZXNNYXRjaGluZygge1xuXHRcdFx0ZXZlbnQ6IGV2ZW50LFxuXHRcdFx0ZW5kOiAgIGZ1bmN0aW9uICggYXJnICkge1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdGFyZy5nZXQoICdfdHlwZScgKSA9PT0gJ2F0dHInXG5cdFx0XHRcdFx0JiYgKFxuXHRcdFx0XHRcdFx0YXJnLmdldCggJ2RhdGFfdHlwZScgKSA9PT0gJ2ludGVnZXInXG5cdFx0XHRcdFx0XHR8fCBhcmcuZ2V0KCAnZGF0YV90eXBlJyApID09PSAnZGVjaW1hbF9udW1iZXInXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgUmVuZGVycyB0aGUgZXh0ZW5zaW9uIHNldHRpbmdzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHBhcmFtIHtqUXVlcnl9ICAgJGVsICAgICAgICAgICAgICAgVGhlIGVsZW1lbnQgYmVpbmcgcmVuZGVyZWQgdG8uXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSAgIGN1cnJlbnRBY3Rpb25UeXBlIFRoZSBjdXJyZW50IGFjdGlvbiB0eXBlLlxuXHQgKiBAcGFyYW0ge1JlYWN0aW9ufSByZWFjdGlvbiAgICAgICAgICBUaGUgcmVhY3Rpb24gdmlldyBvYmplY3QuXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uICggJGVsLCBjdXJyZW50QWN0aW9uVHlwZSwgcmVhY3Rpb24gKSB7XG5cblx0XHR2YXIgaGllcmFyY2hpZXMgPSB0aGlzLmdldEFyZ0hpZXJhcmNoaWVzKCByZWFjdGlvbi5tb2RlbC5nZXQoICdldmVudCcgKSApO1xuXG5cdFx0aWYgKCAwID09PSBoaWVyYXJjaGllcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dmFyIHZpZXcgPSBuZXcgRHluYW1pY1BvaW50c1ZpZXcoe1xuXHRcdFx0bW9kZWw6ICAgICAgIHRoaXMsXG5cdFx0XHRyZWFjdGlvbjogICAgcmVhY3Rpb24sXG5cdFx0XHRoaWVyYXJjaGllczogaGllcmFyY2hpZXNcblx0XHR9KTtcblxuXHRcdHJlYWN0aW9uLiRzZXR0aW5ncy5hcHBlbmQoIHZpZXcucmVuZGVyKCkuJGVsICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0dmFsaWRhdGVSZWFjdGlvbjogZnVuY3Rpb24gKCBtb2RlbCwgYXR0cmlidXRlcyApIHtcblxuXHRcdGlmICggYXR0cmlidXRlcy5keW5hbWljX3BvaW50cyApIHtcblxuXHRcdFx0aWYgKCAwID09PSBhdHRyaWJ1dGVzLnBvaW50cyApIHtcblxuXHRcdFx0XHRkZWxldGUgYXR0cmlidXRlcy5keW5hbWljX3BvaW50cztcblxuXHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0YXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5hcmdcblx0XHRcdFx0JiYgJ3N0cmluZycgPT09IHR5cGVvZiBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZ1xuXHRcdFx0KSB7XG5cblx0XHRcdFx0YXR0cmlidXRlcy5keW5hbWljX3BvaW50cy5hcmcgPSBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZy5zcGxpdChcblx0XHRcdFx0XHQnLCdcblx0XHRcdFx0KTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxufSApO1xuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWNQb2ludHM7XG4iLCIvKipcbiAqIEBzdW1tYXJ5IE1hbmlmZXN0IGZvciB0aGUgZHluYW1pYyBwb2ludHMgZXh0ZW5zaW9uIGFwcC5cbiAqXG4gKiBAc2luY2UgMS4wLjBcbiAqL1xuXG52YXIgaG9va3MgPSB3cC53b3JkcG9pbnRzLmhvb2tzO1xuXG4vLyBWaWV3c1xuaG9va3Mudmlldy5EeW5hbWljUG9pbnRzID0gcmVxdWlyZSggJy4vdmlld3MvZXh0ZW5zaW9uLmpzJyApO1xuXG4vLyBDb250cm9sbGVycy5cbmhvb2tzLmV4dGVuc2lvbi5EeW5hbWljUG9pbnRzID0gcmVxdWlyZSggJy4vY29udHJvbGxlcnMvZXh0ZW5zaW9uLmpzJyApO1xuXG4vLyBSZWdpc3RlciB0aGUgZXh0ZW5zaW9uLlxuaG9va3MuRXh0ZW5zaW9ucy5hZGQoIG5ldyBob29rcy5leHRlbnNpb24uRHluYW1pY1BvaW50cygpICk7XG5cbi8vIEVPRlxuIiwiLyoqXG4gKiBAc3VtbWFyeSBEeW5hbWljIFBvaW50cyBob29rIGV4dGVuc2lvbiB2aWV3IG9iamVjdC5cbiAqXG4gKiBAc2luY2UgMS4wLjBcbiAqXG4gKiBAbW9kdWxlXG4gKi9cblxudmFyIEJhc2UgPSB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuQmFzZSxcblx0RmllbGRzID0gd3Aud29yZHBvaW50cy5ob29rcy5GaWVsZHMsXG5cdEFyZ3MgPSB3cC53b3JkcG9pbnRzLmhvb2tzLkFyZ3MsXG5cdCQgPSBCYWNrYm9uZS4kLFxuXHREeW5hbWljUG9pbnRzO1xuXG4vKipcbiAqIHdwLndvcmRwb2ludHMuaG9va3Mudmlldy5EeW5hbWljUG9pbnRzXG4gKlxuICogQHNpbmNlIDEuMC4wXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuVmlld1xuICogQGF1Z21lbnRzIHdwLndvcmRwb2ludHMuaG9va3Mudmlldy5CYXNlXG4gKi9cbkR5bmFtaWNQb2ludHMgPSBCYXNlLmV4dGVuZCh7XG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0bmFtZXNwYWNlOiAnZHluYW1pYy1wb2ludHMnLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGNsYXNzTmFtZTogJ3dvcmRwb2ludHMtZHluYW1pYy1wb2ludHMnLFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBUaGUgdGVtcGxhdGUgdG8gYnVpbGQgdGhlIHNldHRpbmdzIGZvcm0gZnJvbS5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEBtZW1iZXIge2Z1bmN0aW9ufVxuXHQgKi9cblx0dGVtcGxhdGU6IHdwLndvcmRwb2ludHMuaG9va3MudGVtcGxhdGUoICdkeW5hbWljLXBvaW50cy1ob29rLXNldHRpbmdzJyApLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGV2ZW50czogIGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBldmVudHMgPSB7XG5cdFx0XHQnY2xpY2sgLmVuYWJsZSc6ICAnZW5hYmxlJyxcblx0XHRcdCdjbGljayAuZGlzYWJsZSc6ICdkaXNhYmxlJyxcblx0XHRcdCdjaGFuZ2UgW25hbWU9XCJkeW5hbWljX3BvaW50c1thcmddXCJdJzogJ21heWJlU2hvd1JvdW5kaW5nRm9yQXJnJ1xuXHRcdH07XG5cblx0XHQvKlxuXHRcdCAqIFVzZSBmZWF0dXJlIGRldGVjdGlvbiB0byBkZXRlcm1pbmUgd2hldGhlciB3ZSBzaG91bGQgdXNlIHRoZSBgaW5wdXRgXG5cdFx0ICogZXZlbnQuIElucHV0IGlzIHByZWZlcnJlZCBidXQgbGFja3Mgc3VwcG9ydCBpbiBsZWdhY3kgYnJvd3NlcnMuXG5cdFx0ICovXG5cdFx0aWYgKCAnb25pbnB1dCcgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2lucHV0JyApICkge1xuXHRcdFx0ZXZlbnRzWydpbnB1dCBbbmFtZT1cImR5bmFtaWNfcG9pbnRzW211bHRpcGx5X2J5XVwiXSddID0gJ21heWJlU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeSc7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGV2ZW50c1sna2V5dXAgW25hbWU9XCJkeW5hbWljX3BvaW50c1ttdWx0aXBseV9ieV1cIl0nXSA9ICdtYXliZVNob3dSb3VuZGluZ0Zvck11bHRpcGx5QnknO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudHM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFRoZSBhcmcgaGllcmFyY2hpZXMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtBcmdbXVtdfVxuXHQgKi9cblx0aGllcmFyY2hpZXM6IFtdLFxuXG5cdC8qKlxuXHQgKiBUaGUgZXh0ZW5zaW9uIHNldHRpbmdzIGVsZW1lbnQgb2JqZWN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQG1lbWJlciB7alF1ZXJ5fVxuXHQgKi9cblx0JHNldHRpbmdzOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBUaGUgaW5wdXQgZWxlbWVudCBmb3IgdGhlIHJlZ3VsYXIgcG9pbnRzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQG1lbWJlciB7alF1ZXJ5fVxuXHQgKi9cblx0JHJlZ3VsYXJQb2ludHNJbnB1dDogbnVsbCxcblxuXHQvKipcblx0ICogVGhlIHdyYXBwZXIgZWxlbWVudCBmb3IgdGhlIGZpZWxkIGZvciB0aGUgcmVndWxhciBwb2ludHMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkcmVndWxhclBvaW50czogbnVsbCxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG5cblx0XHR0aGlzLmhpZXJhcmNoaWVzID0gb3B0aW9ucy5oaWVyYXJjaGllcztcblxuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dCA9IHRoaXMucmVhY3Rpb24uJHNldHRpbmdzLmZpbmQoICdbbmFtZT1wb2ludHNdJyApO1xuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHMgPSB0aGlzLiRyZWd1bGFyUG9pbnRzSW5wdXQuY2xvc2VzdCggJ3AuZGVzY3JpcHRpb24nICk7XG5cblx0XHR0aGlzLm9uKCAncmVuZGVyJywgdGhpcy5tYXliZVNob3dSb3VuZGluZyApO1xuXG5cdFx0dGhpcy5saXN0ZW5UbyggdGhpcy5tb2RlbCwgJ2ludmFsaWQnLCB0aGlzLnNob3dWYWxpZGF0aW9uRXJyb3JzICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFJlbmRlcnMgdGhlIHZpZXcuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcmV0dXJuIHtEeW5hbWljUG9pbnRzfSBUaGUgdmlldyBvYmplY3QuXG5cdCAqL1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBvcHRpb25zID0gW107XG5cblx0XHRfLmVhY2goIHRoaXMuaGllcmFyY2hpZXMsIGZ1bmN0aW9uICggaGllcmFyY2h5ICkge1xuXHRcdFx0b3B0aW9ucy5wdXNoKCB7XG5cdFx0XHRcdGxhYmVsOiBBcmdzLmJ1aWxkSGllcmFyY2h5SHVtYW5JZCggaGllcmFyY2h5ICksXG5cdFx0XHRcdHZhbHVlOiBfLnBsdWNrKCBfLnBsdWNrKCBoaWVyYXJjaHksICdhdHRyaWJ1dGVzJyApLCAnc2x1ZycgKS5qb2luKCAnLCcgKVxuXHRcdFx0fSApO1xuXHRcdH0pO1xuXG5cdFx0dmFyIHZhbHVlID0gdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoIFsgJ2R5bmFtaWNfcG9pbnRzJywgJ2FyZycgXSApO1xuXG5cdFx0aWYgKCBfLmlzQXJyYXkoIHZhbHVlICkgKSB7XG5cdFx0XHR2YWx1ZSA9IHZhbHVlLmpvaW4oICcsJyApO1xuXHRcdH1cblxuXHRcdHZhciBhcmdGaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbYXJnXSdcblx0XHRcdCwgdmFsdWVcblx0XHRcdCwge1xuXHRcdFx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRcdFx0b3B0aW9uczogb3B0aW9ucyxcblx0XHRcdFx0bGFiZWw6IHRoaXMubW9kZWwuZGF0YS5hcmdfbGFiZWxcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0dmFyIG11bHRpcGx5QnlGaWVsZCA9IEZpZWxkcy5jcmVhdGUoXG5cdFx0XHQnZHluYW1pY19wb2ludHNbbXVsdGlwbHlfYnldJ1xuXHRcdFx0LCB0aGlzLnJlYWN0aW9uLm1vZGVsLmdldCggWyAnZHluYW1pY19wb2ludHMnLCAnbXVsdGlwbHlfYnknIF0gKVxuXHRcdFx0LCB7XG5cdFx0XHRcdHR5cGU6ICdudW1iZXInLFxuXHRcdFx0XHQnZGVmYXVsdCc6IDEsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEubXVsdGlwbHlfYnlfbGFiZWxcblx0XHRcdH1cblx0XHQpO1xuXG5cdFx0dGhpcy4kZWwuaHRtbCggdGhpcy50ZW1wbGF0ZSgpICk7XG5cblx0XHR0aGlzLiRzZXR0aW5ncyA9IHRoaXMuJCggJy53b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLXNldHRpbmdzJyApO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3MuaHRtbCggYXJnRmllbGQgKyBtdWx0aXBseUJ5RmllbGQgKTtcblxuXHRcdGlmICggdmFsdWUgJiYgMCA9PT0gdGhpcy5yZWFjdGlvbi5tb2RlbC5nZXQoICdwb2ludHMnICkgKSB7XG5cdFx0XHR0aGlzLiRzZXR0aW5ncy5zaG93KCk7XG5cdFx0XHR0aGlzLiQoICcuZW5hYmxlJyApLmhpZGUoKTtcblx0XHRcdHRoaXMuJCggJy5kaXNhYmxlJyApLnNob3coKTtcblx0XHRcdHRoaXMuJHJlZ3VsYXJQb2ludHMuaGlkZSgpO1xuXHRcdH1cblxuXHRcdHRoaXMudHJpZ2dlciggJ3JlbmRlcicgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBTaG93cyB0aGUgZXh0ZW5zaW9ucydzIHNldHRpbmdzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGVuYWJsZTogZnVuY3Rpb24gKCBldmVudCApIHtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR0aGlzLiRzZXR0aW5ncy5zaG93KCk7XG5cdFx0dGhpcy4kKCAnLmVuYWJsZScgKS5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLmRpc2FibGUnICkuc2hvdygpLmZvY3VzKCk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50cy5oaWRlKCk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50c0lucHV0LnZhbCggMCApO1xuXHRcdHRoaXMucmVhY3Rpb24ubG9ja09wZW4oKTtcblx0fSxcblxuXHQvKipcblx0ICogSGlkZXMgdGhlIGV4dGVuc2lvbidzIHNldHRpbmdzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGRpc2FibGU6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3MuaGlkZSgpO1xuXHRcdHRoaXMuJCggJy5kaXNhYmxlJyApLmhpZGUoKTtcblx0XHR0aGlzLiQoICcuZW5hYmxlJyApLnNob3coKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLnNob3coKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzSW5wdXQuZm9jdXMoKTtcblx0XHR0aGlzLnJlYWN0aW9uLmxvY2tPcGVuKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIERpc3BsYXlzIHRoZSByb3VuZGluZyBmaWVsZC5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRzaG93Um91bmRpbmc6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciAkZmllbGQgPSB0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1yb3VuZGluZy1tZXRob2QnICk7XG5cblx0XHRpZiAoICEgJGZpZWxkLmxlbmd0aCApIHtcblxuXHRcdFx0dmFyIGZpZWxkID0gRmllbGRzLmNyZWF0ZShcblx0XHRcdFx0J2R5bmFtaWNfcG9pbnRzW3JvdW5kaW5nX21ldGhvZF0nXG5cdFx0XHRcdCwgdGhpcy5tb2RlbC5nZXQoIFsnZHluYW1pY19wb2ludHMnLCAncm91bmRpbmdfbWV0aG9kJ10gKVxuXHRcdFx0XHQsIHtcblx0XHRcdFx0XHR0eXBlOiAnc2VsZWN0Jyxcblx0XHRcdFx0XHRvcHRpb25zOiB0aGlzLm1vZGVsLmRhdGEucm91bmRpbmdfbWV0aG9kcyxcblx0XHRcdFx0XHRsYWJlbDogdGhpcy5tb2RlbC5kYXRhLnJvdW5kaW5nX21ldGhvZF9sYWJlbFxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0XHQkZmllbGQgPSAkKCAnPGRpdiBjbGFzcz1cIndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtcm91bmRpbmctbWV0aG9kXCI+PC9kaXY+JyApXG5cdFx0XHRcdC5odG1sKCBmaWVsZCApO1xuXG5cdFx0XHR0aGlzLiRzZXR0aW5ncy5hcHBlbmQoICRmaWVsZCApO1xuXHRcdH1cblxuXHRcdCRmaWVsZC5zaG93KCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhpZGVzIHRoZSByb3VuZGluZyBmaWVsZC5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRoaWRlUm91bmRpbmc6IGZ1bmN0aW9uICgpIHtcblx0XHR0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1yb3VuZGluZy1tZXRob2QnICkuaGlkZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBDaGVja3MgaWYgdGhlIHJvdW5kaW5nIGZpZWxkIHNob3VsZCBiZSBzaG93bi5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IFRydWUgaWYgdGhlIGZpZWxkIHNob3VsZCBiZSBzaG93biwgZmFsc2Ugb3RoZXJ3aXNlLlxuXHQgKi9cblx0c2hvdWxkU2hvd1JvdW5kaW5nOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5zaG91bGRTaG93Um91bmRpbmdGb3JNdWx0aXBseUJ5KClcblx0XHRcdHx8IHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yQXJnKClcblx0XHQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBEaXNwbGF5cyB0aGUgcm91bmRpbmcgZmllbGQsIGlmIGl0IHNob3VsZCBiZSBzaG93bi5cblx0ICpcblx0ICogSWYgcm91bmRpbmcgaXMgbm90IG5lY2Vzc2FyeSwgaXQgZW5zdXJlcyB0aGF0IHRoZSBmaWVsZCBpcyBoaWRkZW4uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0bWF5YmVTaG93Um91bmRpbmc6IGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmICggdGhpcy5zaG91bGRTaG93Um91bmRpbmcoKSApIHtcblx0XHRcdHRoaXMuc2hvd1JvdW5kaW5nKCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuaGlkZVJvdW5kaW5nKCk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBDaGVja3MgaWYgdGhlIHJvdW5kaW5nIHNob3VsZCBiZSBzaG93biBiYXNlZCBvbiB0aGUgc2VsZWN0ZWQgYXJnLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgcm91bmRpbmcgZmllbGQgc2hvdWxkIGJlIHNob3duIGZvciB0aGlzIGFyZy5cblx0ICovXG5cdHNob3VsZFNob3dSb3VuZGluZ0ZvckFyZzogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyICRhcmdTZWxlY3RvciA9IHRoaXMuJCggJ1tuYW1lPVwiZHluYW1pY19wb2ludHNbYXJnXVwiXScgKTtcblxuXHRcdHZhciBhcmdzID0gQXJncy5nZXRBcmdzRnJvbUhpZXJhcmNoeShcblx0XHRcdCRhcmdTZWxlY3Rvci52YWwoKS5zcGxpdCggJywnIClcblx0XHRcdCwgdGhpcy5tb2RlbC5nZXQoICdldmVudCcgKVxuXHRcdCk7XG5cblx0XHR2YXIgYXJnID0gYXJnc1sgYXJncy5sZW5ndGggLSAxIF07XG5cblx0XHRyZXR1cm4gYXJnLmdldCggJ2RhdGFfdHlwZScgKSA9PT0gJ2RlY2ltYWxfbnVtYmVyJztcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgU2hvd3MgdGhlIHJvdW5kaW5nIGZpZWxkIG9ubHkgaWYgbmVjZXNzYXJ5IGJhc2VkIG9uIHRoZSBzZWxlY3RlZCBhcmcuXG5cdCAqXG5cdCAqIElmIHJvdW5kaW5nIGlzIG5vdCBuZWNlc3NhcnksIGl0IGVuc3VyZXMgdGhhdCB0aGUgZmllbGQgaXMgaGlkZGVuLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdG1heWJlU2hvd1JvdW5kaW5nRm9yQXJnOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRpZiAoIHRoaXMuc2hvdWxkU2hvd1JvdW5kaW5nRm9yQXJnKCkgKSB7XG5cdFx0XHR0aGlzLnNob3dSb3VuZGluZygpO1xuXHRcdH0gZWxzZSBpZiAoICEgdGhpcy5zaG91bGRTaG93Um91bmRpbmdGb3JNdWx0aXBseUJ5KCkgKSB7XG5cdFx0XHR0aGlzLmhpZGVSb3VuZGluZygpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgQ2hlY2tzIGlmIHRoZSByb3VuZGluZyBzaG91bGQgYmUgc2hvd24gZm9yIHRoZSB2YWx1ZSB0byBtdWx0aXBseSBieS5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgcm91bmRpbmcgc2hvdWxkIGJlIHNob3duIGZvciB0aGUgbXVsdGlwbHkgYnkgdmFsdWUuXG5cdCAqL1xuXHRzaG91bGRTaG93Um91bmRpbmdGb3JNdWx0aXBseUJ5OiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgJG11bHRpcGx5QnkgPSB0aGlzLiQoICdbbmFtZT1cImR5bmFtaWNfcG9pbnRzW211bHRpcGx5X2J5XVwiXScgKTtcblxuXHRcdHJldHVybiAtMSAhPT0gJG11bHRpcGx5QnkudmFsKCkuaW5kZXhPZiggJy4nICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFNob3dzIHRoZSByb3VuZGluZyBvbmx5IGlmIG5lY2Vzc2FyeSBiYXNlZCBvbiB0aGUgbXVsdGlwbHkgYnkgdmFsdWUuXG5cdCAqXG5cdCAqIElmIHJvdW5kaW5nIGlzIG5vdCBuZWNlc3NhcnksIGl0IGVuc3VyZXMgdGhhdCB0aGUgZmllbGQgaXMgaGlkZGVuLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdG1heWJlU2hvd1JvdW5kaW5nRm9yTXVsdGlwbHlCeTogIGZ1bmN0aW9uICgpIHtcblxuXHRcdGlmICggdGhpcy5zaG91bGRTaG93Um91bmRpbmdGb3JNdWx0aXBseUJ5KCkgKSB7XG5cdFx0XHR0aGlzLnNob3dSb3VuZGluZygpO1xuXHRcdH0gZWxzZSBpZiAoICEgdGhpcy5zaG91bGRTaG93Um91bmRpbmdGb3JBcmcoKSApIHtcblx0XHRcdHRoaXMuaGlkZVJvdW5kaW5nKCk7XG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljUG9pbnRzO1xuIl19

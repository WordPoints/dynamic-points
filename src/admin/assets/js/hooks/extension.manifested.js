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

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9jb250cm9sbGVycy9leHRlbnNpb24uanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9leHRlbnNpb24ubWFuaWZlc3QuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy92aWV3cy9leHRlbnNpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBzdW1tYXJ5IER5bmFtaWMgUG9pbnRzIGhvb2sgZXh0ZW5zaW9uIGNvbnRyb2xsZXIgb2JqZWN0LlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG52YXIgRXh0ZW5zaW9uID0gd3Aud29yZHBvaW50cy5ob29rcy5jb250cm9sbGVyLkV4dGVuc2lvbixcblx0QXJncyA9IHdwLndvcmRwb2ludHMuaG9va3MuQXJncyxcblx0RHluYW1pY1BvaW50c1ZpZXcgPSB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuRHluYW1pY1BvaW50cztcblxuLyoqXG4gKiB3cC53b3JkcG9pbnRzLmhvb2tzLmV4dGVuc2lvbi5EeW5hbWljUG9pbnRzXG4gKlxuICogQHNpbmNlIDEuMC4wXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqIEBhdWdtZW50cyB3cC53b3JkcG9pbnRzLmhvb2tzLmNvbnRyb2xsZXIuRXh0ZW5zaW9uXG4gKi9cbnZhciBEeW5hbWljUG9pbnRzID0gRXh0ZW5zaW9uLmV4dGVuZCh7XG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZGVmYXVsdHM6IHtcblx0XHRzbHVnOiAnZHluYW1pY19wb2ludHMnXG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IENoZWNrcyB3aGV0aGVyIGEgcmVhY3RvciBpcyBhIHBvaW50cyByZWFjdG9yLlxuXHQgKlxuXHQgKiBXZSBuZWVkIHRvIGRvIHRoaXMsIGJlY2F1c2Ugd2Ugb25seSBpbnRlZ3JhdGUgd2l0aCBwb2ludHMgcmVhY3RvcnMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcmVhY3RvciBUaGUgc2x1ZyBvZiB0aGUgcmVhY3RvciB0byBjaGVjay5cblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgcmVhY3RvciBpcyBhIHBvaW50cyByZWFjdG9yIG9yIG5vdC5cblx0ICovXG5cdGlzUG9pbnRzUmVhY3RvcjogZnVuY3Rpb24gKCByZWFjdG9yICkge1xuXHRcdHJldHVybiAncG9pbnRzJyA9PT0gcmVhY3RvciB8fCAncG9pbnRzX2xlZ2FjeScgPT09IHJlYWN0b3I7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0aW5pdFJlYWN0aW9uOiBmdW5jdGlvbiAoIHJlYWN0aW9uICkge1xuXG5cdFx0aWYgKCAhIHRoaXMuaXNQb2ludHNSZWFjdG9yKCByZWFjdGlvbi5tb2RlbC5nZXQoICdyZWFjdG9yJyApICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5saXN0ZW5UbyggcmVhY3Rpb24sICdyZW5kZXI6ZmllbGRzJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgR2V0cyB0aGUgYXJnIGhpZXJhcmNoaWVzIHRoYXQgY2FuIGJlIHVzZWQgaW4gZHluYW1pYyBjYWxjdWxhdGlvbnMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIGdldCB0aGUgYXJnIGhpZXJhcmNoaWVzIGZyb20uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0FyZ1tdW119IFRoZSBtYXRjaGluZyBhcmcgaGllcmFyY2hpZXMuXG5cdCAqL1xuXHRnZXRBcmdIaWVyYXJjaGllczogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRyZXR1cm4gQXJncy5nZXRIaWVyYXJjaGllc01hdGNoaW5nKCB7XG5cdFx0XHRldmVudDogZXZlbnQsXG5cdFx0XHRlbmQ6ICAgZnVuY3Rpb24gKCBhcmcgKSB7XG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0YXJnLmdldCggJ190eXBlJyApID09PSAnYXR0cidcblx0XHRcdFx0XHQmJiAoXG5cdFx0XHRcdFx0XHRhcmcuZ2V0KCAnZGF0YV90eXBlJyApID09PSAnaW50ZWdlcidcblx0XHRcdFx0XHRcdHx8IGFyZy5nZXQoICdkYXRhX3R5cGUnICkgPT09ICdkZWNpbWFsX251bWJlcidcblx0XHRcdFx0XHQpXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBSZW5kZXJzIHRoZSBleHRlbnNpb24gc2V0dGluZ3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge2pRdWVyeX0gICAkZWwgICAgICAgICAgICAgICBUaGUgZWxlbWVudCBiZWluZyByZW5kZXJlZCB0by5cblx0ICogQHBhcmFtIHtzdHJpbmd9ICAgY3VycmVudEFjdGlvblR5cGUgVGhlIGN1cnJlbnQgYWN0aW9uIHR5cGUuXG5cdCAqIEBwYXJhbSB7UmVhY3Rpb259IHJlYWN0aW9uICAgICAgICAgIFRoZSByZWFjdGlvbiB2aWV3IG9iamVjdC5cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24gKCAkZWwsIGN1cnJlbnRBY3Rpb25UeXBlLCByZWFjdGlvbiApIHtcblxuXHRcdHZhciBoaWVyYXJjaGllcyA9IHRoaXMuZ2V0QXJnSGllcmFyY2hpZXMoIHJlYWN0aW9uLm1vZGVsLmdldCggJ2V2ZW50JyApICk7XG5cblx0XHRpZiAoIDAgPT09IGhpZXJhcmNoaWVzLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgdmlldyA9IG5ldyBEeW5hbWljUG9pbnRzVmlldyh7XG5cdFx0XHRtb2RlbDogICAgICAgdGhpcyxcblx0XHRcdHJlYWN0aW9uOiAgICByZWFjdGlvbixcblx0XHRcdGhpZXJhcmNoaWVzOiBoaWVyYXJjaGllc1xuXHRcdH0pO1xuXG5cdFx0cmVhY3Rpb24uJHNldHRpbmdzLmFwcGVuZCggdmlldy5yZW5kZXIoKS4kZWwgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHR2YWxpZGF0ZVJlYWN0aW9uOiBmdW5jdGlvbiAoIG1vZGVsLCBhdHRyaWJ1dGVzICkge1xuXG5cdFx0aWYgKCBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzICkge1xuXG5cdFx0XHRpZiAoIDAgPT09IGF0dHJpYnV0ZXMucG9pbnRzICkge1xuXG5cdFx0XHRcdGRlbGV0ZSBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzO1xuXG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZ1xuXHRcdFx0XHQmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnXG5cdFx0XHQpIHtcblxuXHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZyA9IGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnLnNwbGl0KFxuXHRcdFx0XHRcdCcsJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHluYW1pY1BvaW50cztcbiIsIi8qKlxuICogQHN1bW1hcnkgTWFuaWZlc3QgZm9yIHRoZSBkeW5hbWljIHBvaW50cyBleHRlbnNpb24gYXBwLlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICovXG5cbnZhciBob29rcyA9IHdwLndvcmRwb2ludHMuaG9va3M7XG5cbi8vIFZpZXdzXG5ob29rcy52aWV3LkR5bmFtaWNQb2ludHMgPSByZXF1aXJlKCAnLi92aWV3cy9leHRlbnNpb24uanMnICk7XG5cbi8vIENvbnRyb2xsZXJzLlxuaG9va3MuZXh0ZW5zaW9uLkR5bmFtaWNQb2ludHMgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9leHRlbnNpb24uanMnICk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBleHRlbnNpb24uXG5ob29rcy5FeHRlbnNpb25zLmFkZCggbmV3IGhvb2tzLmV4dGVuc2lvbi5EeW5hbWljUG9pbnRzKCkgKTtcblxuLy8gRU9GXG4iLCIvKipcbiAqIEBzdW1tYXJ5IER5bmFtaWMgUG9pbnRzIGhvb2sgZXh0ZW5zaW9uIHZpZXcgb2JqZWN0LlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG52YXIgQmFzZSA9IHdwLndvcmRwb2ludHMuaG9va3Mudmlldy5CYXNlLFxuXHRGaWVsZHMgPSB3cC53b3JkcG9pbnRzLmhvb2tzLkZpZWxkcyxcblx0QXJncyA9IHdwLndvcmRwb2ludHMuaG9va3MuQXJncyxcblx0JCA9IEJhY2tib25lLiQsXG5cdER5bmFtaWNQb2ludHM7XG5cbi8qKlxuICogd3Aud29yZHBvaW50cy5ob29rcy52aWV3LkR5bmFtaWNQb2ludHNcbiAqXG4gKiBAc2luY2UgMS4wLjBcbiAqXG4gKiBAY2xhc3NcbiAqIEBhdWdtZW50cyBCYWNrYm9uZS5WaWV3XG4gKiBAYXVnbWVudHMgd3Aud29yZHBvaW50cy5ob29rcy52aWV3LkJhc2VcbiAqL1xuRHluYW1pY1BvaW50cyA9IEJhc2UuZXh0ZW5kKHtcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRuYW1lc3BhY2U6ICdkeW5hbWljLXBvaW50cycsXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0Y2xhc3NOYW1lOiAnd29yZHBvaW50cy1keW5hbWljLXBvaW50cycsXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFRoZSB0ZW1wbGF0ZSB0byBidWlsZCB0aGUgc2V0dGluZ3MgZm9ybSBmcm9tLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQG1lbWJlciB7ZnVuY3Rpb259XG5cdCAqL1xuXHR0ZW1wbGF0ZTogd3Aud29yZHBvaW50cy5ob29rcy50ZW1wbGF0ZSggJ2R5bmFtaWMtcG9pbnRzLWhvb2stc2V0dGluZ3MnICksXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZXZlbnRzOiAge1xuXHRcdCdjbGljayAuZW5hYmxlJzogICdlbmFibGUnLFxuXHRcdCdjbGljayAuZGlzYWJsZSc6ICdkaXNhYmxlJyxcblx0XHQnY2hhbmdlIFtuYW1lPVwiZHluYW1pY19wb2ludHNbYXJnXVwiXSc6ICdtYXliZVNob3dSb3VuZGluZydcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgVGhlIGFyZyBoaWVyYXJjaGllcy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEBtZW1iZXIge0FyZ1tdW119XG5cdCAqL1xuXHRoaWVyYXJjaGllczogW10sXG5cblx0LyoqXG5cdCAqIFRoZSBleHRlbnNpb24gc2V0dGluZ3MgZWxlbWVudCBvYmplY3QuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkc2V0dGluZ3M6IG51bGwsXG5cblx0LyoqXG5cdCAqIFRoZSBpbnB1dCBlbGVtZW50IGZvciB0aGUgcmVndWxhciBwb2ludHMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkcmVndWxhclBvaW50c0lucHV0OiBudWxsLFxuXG5cdC8qKlxuXHQgKiBUaGUgd3JhcHBlciBlbGVtZW50IGZvciB0aGUgZmllbGQgZm9yIHRoZSByZWd1bGFyIHBvaW50cy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEBtZW1iZXIge2pRdWVyeX1cblx0ICovXG5cdCRyZWd1bGFyUG9pbnRzOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uICggb3B0aW9ucyApIHtcblxuXHRcdHRoaXMuaGllcmFyY2hpZXMgPSBvcHRpb25zLmhpZXJhcmNoaWVzO1xuXG5cdFx0dGhpcy4kcmVndWxhclBvaW50c0lucHV0ID0gdGhpcy5yZWFjdGlvbi4kc2V0dGluZ3MuZmluZCggJ1tuYW1lPXBvaW50c10nICk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50cyA9IHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dC5jbG9zZXN0KCAncC5kZXNjcmlwdGlvbicgKTtcblxuXHRcdHRoaXMub24oICdyZW5kZXInLCB0aGlzLm1heWJlU2hvd1JvdW5kaW5nICk7XG5cblx0XHR0aGlzLmxpc3RlblRvKCB0aGlzLm1vZGVsLCAnaW52YWxpZCcsIHRoaXMuc2hvd1ZhbGlkYXRpb25FcnJvcnMgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgUmVuZGVycyB0aGUgdmlldy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqXG5cdCAqIEByZXR1cm4ge0R5bmFtaWNQb2ludHN9IFRoZSB2aWV3IG9iamVjdC5cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIG9wdGlvbnMgPSBbXTtcblxuXHRcdF8uZWFjaCggdGhpcy5oaWVyYXJjaGllcywgZnVuY3Rpb24gKCBoaWVyYXJjaHkgKSB7XG5cdFx0XHRvcHRpb25zLnB1c2goIHtcblx0XHRcdFx0bGFiZWw6IEFyZ3MuYnVpbGRIaWVyYXJjaHlIdW1hbklkKCBoaWVyYXJjaHkgKSxcblx0XHRcdFx0dmFsdWU6IF8ucGx1Y2soIF8ucGx1Y2soIGhpZXJhcmNoeSwgJ2F0dHJpYnV0ZXMnICksICdzbHVnJyApLmpvaW4oICcsJyApXG5cdFx0XHR9ICk7XG5cdFx0fSk7XG5cblx0XHR2YXIgdmFsdWUgPSB0aGlzLnJlYWN0aW9uLm1vZGVsLmdldCggWyAnZHluYW1pY19wb2ludHMnLCAnYXJnJyBdICk7XG5cblx0XHRpZiAoIF8uaXNBcnJheSggdmFsdWUgKSApIHtcblx0XHRcdHZhbHVlID0gdmFsdWUuam9pbiggJywnICk7XG5cdFx0fVxuXG5cdFx0dmFyIGZpZWxkID0gRmllbGRzLmNyZWF0ZShcblx0XHRcdCdkeW5hbWljX3BvaW50c1thcmddJ1xuXHRcdFx0LCB2YWx1ZVxuXHRcdFx0LCB7XG5cdFx0XHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdFx0XHRvcHRpb25zOiBvcHRpb25zLFxuXHRcdFx0XHRsYWJlbDogdGhpcy5tb2RlbC5kYXRhLmFyZ19sYWJlbFxuXHRcdFx0fVxuXHRcdCk7XG5cblx0XHR0aGlzLiRlbC5odG1sKCB0aGlzLnRlbXBsYXRlKCkgKTtcblxuXHRcdHRoaXMuJHNldHRpbmdzID0gdGhpcy4kKCAnLndvcmRwb2ludHMtZHluYW1pYy1wb2ludHMtc2V0dGluZ3MnICk7XG5cblx0XHR0aGlzLiRzZXR0aW5ncy5odG1sKCBmaWVsZCApO1xuXG5cdFx0aWYgKCB2YWx1ZSAmJiAwID09PSB0aGlzLnJlYWN0aW9uLm1vZGVsLmdldCggJ3BvaW50cycgKSApIHtcblx0XHRcdHRoaXMuJHNldHRpbmdzLnNob3coKTtcblx0XHRcdHRoaXMuJCggJy5lbmFibGUnICkuaGlkZSgpO1xuXHRcdFx0dGhpcy4kKCAnLmRpc2FibGUnICkuc2hvdygpO1xuXHRcdFx0dGhpcy4kcmVndWxhclBvaW50cy5oaWRlKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy50cmlnZ2VyKCAncmVuZGVyJyApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNob3dzIHRoZSBleHRlbnNpb25zJ3Mgc2V0dGluZ3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZW5hYmxlOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHRoaXMuJHNldHRpbmdzLnNob3coKTtcblx0XHR0aGlzLiQoICcuZW5hYmxlJyApLmhpZGUoKTtcblx0XHR0aGlzLiQoICcuZGlzYWJsZScgKS5zaG93KCkuZm9jdXMoKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLmhpZGUoKTtcblx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzSW5wdXQudmFsKCAwICk7XG5cdFx0dGhpcy5yZWFjdGlvbi5sb2NrT3BlbigpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBIaWRlcyB0aGUgZXh0ZW5zaW9uJ3Mgc2V0dGluZ3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZGlzYWJsZTogZnVuY3Rpb24gKCBldmVudCApIHtcblxuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR0aGlzLiRzZXR0aW5ncy5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLmRpc2FibGUnICkuaGlkZSgpO1xuXHRcdHRoaXMuJCggJy5lbmFibGUnICkuc2hvdygpO1xuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHMuc2hvdygpO1xuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dC5mb2N1cygpO1xuXHRcdHRoaXMucmVhY3Rpb24ubG9ja09wZW4oKTtcblx0fSxcblxuXHQvKipcblx0ICogRGlzcGxheXMgdGhlIHJvdW5kaW5nIGZpZWxkLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdHNob3dSb3VuZGluZzogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyICRmaWVsZCA9IHRoaXMuJCggJy53b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLXJvdW5kaW5nLW1ldGhvZCcgKTtcblxuXHRcdGlmICggISAkZmllbGQubGVuZ3RoICkge1xuXG5cdFx0XHR2YXIgZmllbGQgPSBGaWVsZHMuY3JlYXRlKFxuXHRcdFx0XHQnZHluYW1pY19wb2ludHNbcm91bmRpbmdfbWV0aG9kXSdcblx0XHRcdFx0LCB0aGlzLm1vZGVsLmdldCggWydkeW5hbWljX3BvaW50cycsICdyb3VuZGluZ19tZXRob2QnXSApXG5cdFx0XHRcdCwge1xuXHRcdFx0XHRcdHR5cGU6ICdzZWxlY3QnLFxuXHRcdFx0XHRcdG9wdGlvbnM6IHRoaXMubW9kZWwuZGF0YS5yb3VuZGluZ19tZXRob2RzLFxuXHRcdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEucm91bmRpbmdfbWV0aG9kX2xhYmVsXG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cblx0XHRcdCRmaWVsZCA9ICQoICc8ZGl2IGNsYXNzPVwid29yZHBvaW50cy1keW5hbWljLXBvaW50cy1yb3VuZGluZy1tZXRob2RcIj48L2Rpdj4nIClcblx0XHRcdFx0Lmh0bWwoIGZpZWxkICk7XG5cblx0XHRcdHRoaXMuJHNldHRpbmdzLmFwcGVuZCggJGZpZWxkICk7XG5cdFx0fVxuXG5cdFx0JGZpZWxkLnNob3coKTtcblx0fSxcblxuXHQvKipcblx0ICogSGlkZXMgdGhlIHJvdW5kaW5nIGZpZWxkLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdGhpZGVSb3VuZGluZzogZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuJCggJy53b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzLXJvdW5kaW5nLW1ldGhvZCcgKS5oaWRlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNob3dzIHRoZSByb3VuZGluZyBmaWVsZCBvbmx5IGlmIGl0IGlzIG5lY2Vzc2FyeS5cblx0ICpcblx0ICogSWYgcm91bmRpbmcgaXMgbm90IG5lY2Vzc2FyeSwgaXQgZW5zdXJlcyB0aGF0IHRoZSBmaWVsZCBpcyBoaWRkZW4uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0bWF5YmVTaG93Um91bmRpbmc6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciAkYXJnU2VsZWN0b3IgPSB0aGlzLiQoICdbbmFtZT1cImR5bmFtaWNfcG9pbnRzW2FyZ11cIl0nICk7XG5cblx0XHR2YXIgYXJncyA9IEFyZ3MuZ2V0QXJnc0Zyb21IaWVyYXJjaHkoXG5cdFx0XHQkYXJnU2VsZWN0b3IudmFsKCkuc3BsaXQoICcsJyApXG5cdFx0XHQsIHRoaXMubW9kZWwuZ2V0KCAnZXZlbnQnIClcblx0XHQpO1xuXG5cdFx0dmFyIGFyZyA9IGFyZ3NbIGFyZ3MubGVuZ3RoIC0gMSBdO1xuXG5cdFx0aWYgKCBhcmcuZ2V0KCAnZGF0YV90eXBlJyApID09PSAnZGVjaW1hbF9udW1iZXInICkge1xuXHRcdFx0dGhpcy5zaG93Um91bmRpbmcoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy5oaWRlUm91bmRpbmcoKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IER5bmFtaWNQb2ludHM7XG4iXX0=

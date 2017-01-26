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
			end:   { _type: 'attr', data_type: 'integer' }
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
		'click .disable': 'disable'
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

		this.$regularPointsInput = this.reaction.$settings.find( 'input[name=points]' );
		this.$regularPoints = this.$regularPointsInput.closest( 'p.description' );

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
	}
});

module.exports = DynamicPoints;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9jb250cm9sbGVycy9leHRlbnNpb24uanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy9leHRlbnNpb24ubWFuaWZlc3QuanMiLCJ1bmJ1aWx0L2FkbWluL2Fzc2V0cy9qcy9ob29rcy92aWV3cy9leHRlbnNpb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKipcbiAqIEBzdW1tYXJ5IER5bmFtaWMgUG9pbnRzIGhvb2sgZXh0ZW5zaW9uIGNvbnRyb2xsZXIgb2JqZWN0LlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG52YXIgRXh0ZW5zaW9uID0gd3Aud29yZHBvaW50cy5ob29rcy5jb250cm9sbGVyLkV4dGVuc2lvbixcblx0QXJncyA9IHdwLndvcmRwb2ludHMuaG9va3MuQXJncyxcblx0RHluYW1pY1BvaW50c1ZpZXcgPSB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuRHluYW1pY1BvaW50cztcblxuLyoqXG4gKiB3cC53b3JkcG9pbnRzLmhvb2tzLmV4dGVuc2lvbi5EeW5hbWljUG9pbnRzXG4gKlxuICogQHNpbmNlIDEuMC4wXG4gKlxuICogQGNsYXNzXG4gKiBAYXVnbWVudHMgQmFja2JvbmUuTW9kZWxcbiAqIEBhdWdtZW50cyB3cC53b3JkcG9pbnRzLmhvb2tzLmNvbnRyb2xsZXIuRXh0ZW5zaW9uXG4gKi9cbnZhciBEeW5hbWljUG9pbnRzID0gRXh0ZW5zaW9uLmV4dGVuZCh7XG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0ZGVmYXVsdHM6IHtcblx0XHRzbHVnOiAnZHluYW1pY19wb2ludHMnXG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IENoZWNrcyB3aGV0aGVyIGEgcmVhY3RvciBpcyBhIHBvaW50cyByZWFjdG9yLlxuXHQgKlxuXHQgKiBXZSBuZWVkIHRvIGRvIHRoaXMsIGJlY2F1c2Ugd2Ugb25seSBpbnRlZ3JhdGUgd2l0aCBwb2ludHMgcmVhY3RvcnMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gcmVhY3RvciBUaGUgc2x1ZyBvZiB0aGUgcmVhY3RvciB0byBjaGVjay5cblx0ICpcblx0ICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgcmVhY3RvciBpcyBhIHBvaW50cyByZWFjdG9yIG9yIG5vdC5cblx0ICovXG5cdGlzUG9pbnRzUmVhY3RvcjogZnVuY3Rpb24gKCByZWFjdG9yICkge1xuXHRcdHJldHVybiAncG9pbnRzJyA9PT0gcmVhY3RvciB8fCAncG9pbnRzX2xlZ2FjeScgPT09IHJlYWN0b3I7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKi9cblx0aW5pdFJlYWN0aW9uOiBmdW5jdGlvbiAoIHJlYWN0aW9uICkge1xuXG5cdFx0aWYgKCAhIHRoaXMuaXNQb2ludHNSZWFjdG9yKCByZWFjdGlvbi5tb2RlbC5nZXQoICdyZWFjdG9yJyApICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0dGhpcy5saXN0ZW5UbyggcmVhY3Rpb24sICdyZW5kZXI6ZmllbGRzJywgdGhpcy5yZW5kZXIgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgR2V0cyB0aGUgYXJnIGhpZXJhcmNoaWVzIHRoYXQgY2FuIGJlIHVzZWQgaW4gZHluYW1pYyBjYWxjdWxhdGlvbnMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHRvIGdldCB0aGUgYXJnIGhpZXJhcmNoaWVzIGZyb20uXG5cdCAqXG5cdCAqIEByZXR1cm4ge0FyZ1tdW119IFRoZSBtYXRjaGluZyBhcmcgaGllcmFyY2hpZXMuXG5cdCAqL1xuXHRnZXRBcmdIaWVyYXJjaGllczogZnVuY3Rpb24gKCBldmVudCApIHtcblx0XHRyZXR1cm4gQXJncy5nZXRIaWVyYXJjaGllc01hdGNoaW5nKCB7XG5cdFx0XHRldmVudDogZXZlbnQsXG5cdFx0XHRlbmQ6ICAgeyBfdHlwZTogJ2F0dHInLCBkYXRhX3R5cGU6ICdpbnRlZ2VyJyB9XG5cdFx0fSApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBSZW5kZXJzIHRoZSBleHRlbnNpb24gc2V0dGluZ3MuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAcGFyYW0ge2pRdWVyeX0gICAkZWwgICAgICAgICAgICAgICBUaGUgZWxlbWVudCBiZWluZyByZW5kZXJlZCB0by5cblx0ICogQHBhcmFtIHtzdHJpbmd9ICAgY3VycmVudEFjdGlvblR5cGUgVGhlIGN1cnJlbnQgYWN0aW9uIHR5cGUuXG5cdCAqIEBwYXJhbSB7UmVhY3Rpb259IHJlYWN0aW9uICAgICAgICAgIFRoZSByZWFjdGlvbiB2aWV3IG9iamVjdC5cblx0ICovXG5cdHJlbmRlcjogZnVuY3Rpb24gKCAkZWwsIGN1cnJlbnRBY3Rpb25UeXBlLCByZWFjdGlvbiApIHtcblxuXHRcdHZhciBoaWVyYXJjaGllcyA9IHRoaXMuZ2V0QXJnSGllcmFyY2hpZXMoIHJlYWN0aW9uLm1vZGVsLmdldCggJ2V2ZW50JyApICk7XG5cblx0XHRpZiAoIDAgPT09IGhpZXJhcmNoaWVzLmxlbmd0aCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHR2YXIgdmlldyA9IG5ldyBEeW5hbWljUG9pbnRzVmlldyh7XG5cdFx0XHRtb2RlbDogICAgICAgdGhpcyxcblx0XHRcdHJlYWN0aW9uOiAgICByZWFjdGlvbixcblx0XHRcdGhpZXJhcmNoaWVzOiBoaWVyYXJjaGllc1xuXHRcdH0pO1xuXG5cdFx0cmVhY3Rpb24uJHNldHRpbmdzLmFwcGVuZCggdmlldy5yZW5kZXIoKS4kZWwgKTtcblx0fSxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHR2YWxpZGF0ZVJlYWN0aW9uOiBmdW5jdGlvbiAoIG1vZGVsLCBhdHRyaWJ1dGVzICkge1xuXG5cdFx0aWYgKCBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzICkge1xuXG5cdFx0XHRpZiAoIDAgPT09IGF0dHJpYnV0ZXMucG9pbnRzICkge1xuXG5cdFx0XHRcdGRlbGV0ZSBhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzO1xuXG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZ1xuXHRcdFx0XHQmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnXG5cdFx0XHQpIHtcblxuXHRcdFx0XHRhdHRyaWJ1dGVzLmR5bmFtaWNfcG9pbnRzLmFyZyA9IGF0dHJpYnV0ZXMuZHluYW1pY19wb2ludHMuYXJnLnNwbGl0KFxuXHRcdFx0XHRcdCcsJ1xuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG59ICk7XG5cbm1vZHVsZS5leHBvcnRzID0gRHluYW1pY1BvaW50cztcbiIsIi8qKlxuICogQHN1bW1hcnkgTWFuaWZlc3QgZm9yIHRoZSBkeW5hbWljIHBvaW50cyBleHRlbnNpb24gYXBwLlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICovXG5cbnZhciBob29rcyA9IHdwLndvcmRwb2ludHMuaG9va3M7XG5cbi8vIFZpZXdzXG5ob29rcy52aWV3LkR5bmFtaWNQb2ludHMgPSByZXF1aXJlKCAnLi92aWV3cy9leHRlbnNpb24uanMnICk7XG5cbi8vIENvbnRyb2xsZXJzLlxuaG9va3MuZXh0ZW5zaW9uLkR5bmFtaWNQb2ludHMgPSByZXF1aXJlKCAnLi9jb250cm9sbGVycy9leHRlbnNpb24uanMnICk7XG5cbi8vIFJlZ2lzdGVyIHRoZSBleHRlbnNpb24uXG5ob29rcy5FeHRlbnNpb25zLmFkZCggbmV3IGhvb2tzLmV4dGVuc2lvbi5EeW5hbWljUG9pbnRzKCkgKTtcblxuLy8gRU9GXG4iLCIvKipcbiAqIEBzdW1tYXJ5IER5bmFtaWMgUG9pbnRzIGhvb2sgZXh0ZW5zaW9uIHZpZXcgb2JqZWN0LlxuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBtb2R1bGVcbiAqL1xuXG52YXIgQmFzZSA9IHdwLndvcmRwb2ludHMuaG9va3Mudmlldy5CYXNlLFxuXHRGaWVsZHMgPSB3cC53b3JkcG9pbnRzLmhvb2tzLkZpZWxkcyxcblx0QXJncyA9IHdwLndvcmRwb2ludHMuaG9va3MuQXJncyxcblx0RHluYW1pY1BvaW50cztcblxuLyoqXG4gKiB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuRHluYW1pY1BvaW50c1xuICpcbiAqIEBzaW5jZSAxLjAuMFxuICpcbiAqIEBjbGFzc1xuICogQGF1Z21lbnRzIEJhY2tib25lLlZpZXdcbiAqIEBhdWdtZW50cyB3cC53b3JkcG9pbnRzLmhvb2tzLnZpZXcuQmFzZVxuICovXG5EeW5hbWljUG9pbnRzID0gQmFzZS5leHRlbmQoe1xuXG5cdC8qKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICovXG5cdG5hbWVzcGFjZTogJ2R5bmFtaWMtcG9pbnRzJyxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRjbGFzc05hbWU6ICd3b3JkcG9pbnRzLWR5bmFtaWMtcG9pbnRzJyxcblxuXHQvKipcblx0ICogQHN1bW1hcnkgVGhlIHRlbXBsYXRlIHRvIGJ1aWxkIHRoZSBzZXR0aW5ncyBmb3JtIGZyb20uXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtmdW5jdGlvbn1cblx0ICovXG5cdHRlbXBsYXRlOiB3cC53b3JkcG9pbnRzLmhvb2tzLnRlbXBsYXRlKCAnZHluYW1pYy1wb2ludHMtaG9vay1zZXR0aW5ncycgKSxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRldmVudHM6ICB7XG5cdFx0J2NsaWNrIC5lbmFibGUnOiAgJ2VuYWJsZScsXG5cdFx0J2NsaWNrIC5kaXNhYmxlJzogJ2Rpc2FibGUnXG5cdH0sXG5cblx0LyoqXG5cdCAqIEBzdW1tYXJ5IFRoZSBhcmcgaGllcmFyY2hpZXMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtBcmdbXVtdfVxuXHQgKi9cblx0aGllcmFyY2hpZXM6IFtdLFxuXG5cdC8qKlxuXHQgKiBUaGUgZXh0ZW5zaW9uIHNldHRpbmdzIGVsZW1lbnQgb2JqZWN0LlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQG1lbWJlciB7alF1ZXJ5fVxuXHQgKi9cblx0JHNldHRpbmdzOiBudWxsLFxuXG5cdC8qKlxuXHQgKiBUaGUgaW5wdXQgZWxlbWVudCBmb3IgdGhlIHJlZ3VsYXIgcG9pbnRzLlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQG1lbWJlciB7alF1ZXJ5fVxuXHQgKi9cblx0JHJlZ3VsYXJQb2ludHNJbnB1dDogbnVsbCxcblxuXHQvKipcblx0ICogVGhlIHdyYXBwZXIgZWxlbWVudCBmb3IgdGhlIGZpZWxkIGZvciB0aGUgcmVndWxhciBwb2ludHMuXG5cdCAqXG5cdCAqIEBzaW5jZSAxLjAuMFxuXHQgKlxuXHQgKiBAbWVtYmVyIHtqUXVlcnl9XG5cdCAqL1xuXHQkcmVndWxhclBvaW50czogbnVsbCxcblxuXHQvKipcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiAoIG9wdGlvbnMgKSB7XG5cblx0XHR0aGlzLmhpZXJhcmNoaWVzID0gb3B0aW9ucy5oaWVyYXJjaGllcztcblxuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dCA9IHRoaXMucmVhY3Rpb24uJHNldHRpbmdzLmZpbmQoICdpbnB1dFtuYW1lPXBvaW50c10nICk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50cyA9IHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dC5jbG9zZXN0KCAncC5kZXNjcmlwdGlvbicgKTtcblxuXHRcdHRoaXMubGlzdGVuVG8oIHRoaXMubW9kZWwsICdpbnZhbGlkJywgdGhpcy5zaG93VmFsaWRhdGlvbkVycm9ycyApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBAc3VtbWFyeSBSZW5kZXJzIHRoZSB2aWV3LlxuXHQgKlxuXHQgKiBAc2luY2UgMS4wLjBcblx0ICpcblx0ICogQHJldHVybiB7RHluYW1pY1BvaW50c30gVGhlIHZpZXcgb2JqZWN0LlxuXHQgKi9cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgb3B0aW9ucyA9IFtdO1xuXG5cdFx0Xy5lYWNoKCB0aGlzLmhpZXJhcmNoaWVzLCBmdW5jdGlvbiAoIGhpZXJhcmNoeSApIHtcblx0XHRcdG9wdGlvbnMucHVzaCgge1xuXHRcdFx0XHRsYWJlbDogQXJncy5idWlsZEhpZXJhcmNoeUh1bWFuSWQoIGhpZXJhcmNoeSApLFxuXHRcdFx0XHR2YWx1ZTogXy5wbHVjayggXy5wbHVjayggaGllcmFyY2h5LCAnYXR0cmlidXRlcycgKSwgJ3NsdWcnICkuam9pbiggJywnIClcblx0XHRcdH0gKTtcblx0XHR9KTtcblxuXHRcdHZhciB2YWx1ZSA9IHRoaXMucmVhY3Rpb24ubW9kZWwuZ2V0KCBbICdkeW5hbWljX3BvaW50cycsICdhcmcnIF0gKTtcblxuXHRcdGlmICggXy5pc0FycmF5KCB2YWx1ZSApICkge1xuXHRcdFx0dmFsdWUgPSB2YWx1ZS5qb2luKCAnLCcgKTtcblx0XHR9XG5cblx0XHR2YXIgZmllbGQgPSBGaWVsZHMuY3JlYXRlKFxuXHRcdFx0J2R5bmFtaWNfcG9pbnRzW2FyZ10nXG5cdFx0XHQsIHZhbHVlXG5cdFx0XHQsIHtcblx0XHRcdFx0dHlwZTogJ3NlbGVjdCcsXG5cdFx0XHRcdG9wdGlvbnM6IG9wdGlvbnMsXG5cdFx0XHRcdGxhYmVsOiB0aGlzLm1vZGVsLmRhdGEuYXJnX2xhYmVsXG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdHRoaXMuJGVsLmh0bWwoIHRoaXMudGVtcGxhdGUoKSApO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3MgPSB0aGlzLiQoICcud29yZHBvaW50cy1keW5hbWljLXBvaW50cy1zZXR0aW5ncycgKTtcblxuXHRcdHRoaXMuJHNldHRpbmdzLmh0bWwoIGZpZWxkICk7XG5cblx0XHRpZiAoIHZhbHVlICYmIDAgPT09IHRoaXMucmVhY3Rpb24ubW9kZWwuZ2V0KCAncG9pbnRzJyApICkge1xuXHRcdFx0dGhpcy4kc2V0dGluZ3Muc2hvdygpO1xuXHRcdFx0dGhpcy4kKCAnLmVuYWJsZScgKS5oaWRlKCk7XG5cdFx0XHR0aGlzLiQoICcuZGlzYWJsZScgKS5zaG93KCk7XG5cdFx0XHR0aGlzLiRyZWd1bGFyUG9pbnRzLmhpZGUoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHQvKipcblx0ICogU2hvd3MgdGhlIGV4dGVuc2lvbnMncyBzZXR0aW5ncy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRlbmFibGU6IGZ1bmN0aW9uICggZXZlbnQgKSB7XG5cblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy4kc2V0dGluZ3Muc2hvdygpO1xuXHRcdHRoaXMuJCggJy5lbmFibGUnICkuaGlkZSgpO1xuXHRcdHRoaXMuJCggJy5kaXNhYmxlJyApLnNob3coKS5mb2N1cygpO1xuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHMuaGlkZSgpO1xuXHRcdHRoaXMuJHJlZ3VsYXJQb2ludHNJbnB1dC52YWwoIDAgKTtcblx0XHR0aGlzLnJlYWN0aW9uLmxvY2tPcGVuKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEhpZGVzIHRoZSBleHRlbnNpb24ncyBzZXR0aW5ncy5cblx0ICpcblx0ICogQHNpbmNlIDEuMC4wXG5cdCAqL1xuXHRkaXNhYmxlOiBmdW5jdGlvbiAoIGV2ZW50ICkge1xuXG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHRoaXMuJHNldHRpbmdzLmhpZGUoKTtcblx0XHR0aGlzLiQoICcuZGlzYWJsZScgKS5oaWRlKCk7XG5cdFx0dGhpcy4kKCAnLmVuYWJsZScgKS5zaG93KCk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50cy5zaG93KCk7XG5cdFx0dGhpcy4kcmVndWxhclBvaW50c0lucHV0LmZvY3VzKCk7XG5cdFx0dGhpcy5yZWFjdGlvbi5sb2NrT3BlbigpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEeW5hbWljUG9pbnRzO1xuIl19

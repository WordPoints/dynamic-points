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

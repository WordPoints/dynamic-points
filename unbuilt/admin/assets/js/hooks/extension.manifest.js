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

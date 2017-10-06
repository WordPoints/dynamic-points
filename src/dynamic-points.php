<?php

/**
 * Main file of the extension.
 *
 * ---------------------------------------------------------------------------------|
 * Copyright 2017  J.D. Grimes  (email : jdg@codesymphony.co)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or later, as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 * ---------------------------------------------------------------------------------|
 *
 * @package WordPoints_Dynamic_Points
 * @version 1.0.1
 * @author  J.D. Grimes <jdg@codesymphony.co>
 * @license GPLv2+
 */

wordpoints_register_extension(
	'
		Extension Name: Dynamic Points
		Author:         J.D. Grimes
		Author URI:     https://codesymphony.co/
		Extension URI:  https://wordpoints.org/extensions/dynamic-points/
		Version:        1.0.1
		License:        GPLv2+
		Description:    Let the number of points awarded by a reaction be dynamically calculated at the time of the event.
		Text Domain:    wordpoints-dynamic-points
		Domain Path:    /languages
		Server:         wordpoints.org
		ID:             977
		Namespace:      Dynamic_Points
	'
	, __FILE__
);

WordPoints_Class_Autoloader::register_dir( dirname( __FILE__ ) . '/classes/' );

/**
 * The extension's functions.
 *
 * @since 1.0.0
 */
require_once dirname( __FILE__ ) . '/includes/functions.php';

/**
 * Hook up the extension's actions and filters.
 *
 * @since 1.0.0
 */
require_once dirname( __FILE__ ) . '/includes/actions.php';

if ( is_admin() ) {

	/**
	 * The extension's admin-side functions.
	 *
	 * @since 1.0.0
	 */
	require_once dirname( __FILE__ ) . '/admin/includes/functions.php';

	/**
	 * Hook up the extension's admin-side actions and filters.
	 *
	 * @since 1.0.0
	 */
	require_once dirname( __FILE__ ) . '/admin/includes/actions.php';
}

// EOF

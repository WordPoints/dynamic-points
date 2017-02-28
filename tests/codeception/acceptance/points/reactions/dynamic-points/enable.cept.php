<?php

/**
 * Tests using dynamic points with a points reaction.
 *
 * @package WordPoints\Codeception
 * @since 1.0.0
 */

use WordPoints\Tests\Codeception\Element\Reaction;

$I = new AcceptanceTester( $scenario );
$I->wantTo( 'Use dynamic points with a points reaction' );

$the_reaction = $I->hadCreatedAPointsReaction(
	array(
		'event' => 'post_publish\\post',
		'target' => array( 'post\\post', 'author', 'user' ),
	)
);

$reaction = new Reaction( $I, $the_reaction );

$I->amLoggedInAsAdminOnPage( 'wp-admin/admin.php?page=wordpoints_points_types' );

$reaction->edit();
$I->canSeeElement( $reaction . '[name=points]' );

$I->click( 'Enable Dynamic Points', (string) $reaction );
$I->canSeeElement( $reaction . '[name="dynamic_points[arg]"]' );
$I->cantSeeElement( $reaction . '[name=points]' );

$reaction->save();

// EOF

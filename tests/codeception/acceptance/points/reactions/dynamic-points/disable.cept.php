<?php

/**
 * Tests disabling dynamic points for a points reaction.
 *
 * @package WordPoints\Codeception
 * @since 1.0.0
 */

use WordPoints\Tests\Codeception\Element\Reaction;

$I = new AcceptanceTester( $scenario );
$I->wantTo( 'Disable dynamic points for a points reaction' );

$the_reaction = $I->hadCreatedAPointsReaction(
	array(
		'event' => 'post_publish\\post',
		'target' => array( 'post\\post', 'author', 'user' ),
		'points' => 0,
		'dynamic_points' => array(
			'arg' => array( 'post\\post', 'comment_count' ),
		),
	)
);

$reaction = new Reaction( $I, $the_reaction );

$I->amLoggedInAsAdminOnPage( 'wp-admin/admin.php?page=wordpoints_points_types' );

$reaction->edit();
$I->cantSeeElement( $reaction . '[name=points]' );
$I->canSeeElement( $reaction . '[name="dynamic_points[arg]"]' );

$I->click( 'Disable Dynamic Points', (string) $reaction );
$I->cantSeeElement( $reaction . '[name="dynamic_points[arg]"]' );
$I->canSeeElement( $reaction . '[name=points]' );

$reaction->save();

// EOF

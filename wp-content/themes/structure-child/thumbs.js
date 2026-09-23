/**
 * Thumbnail rows that stay symmetrical when part-filled.
 *
 * The client's rule, across five columns:
 *
 *   1 item  -> column 3          (dead centre)
 *   2 items -> columns 2 and 4   (straddling the centre)
 *   3 items -> columns 2, 3, 4
 *   4 items -> columns 1, 2, 4, 5 (centre deliberately empty)
 *   5 items -> all five
 *
 * He is right that an odd number of slots is better here: five columns have a
 * true middle, so a single thumbnail has somewhere to sit. With an even count
 * there is no centre and one item always looks off.
 *
 * With more than five, full rows fill left to right and only the final,
 * part-filled row is placed by the rule above — that is the row that would
 * otherwise look lopsided.
 *
 * CSS alone could do this with :has() and a case per count, but it would be
 * forty lines of near-identical rules and would silently stop working for a
 * count nobody wrote a rule for. Counting the children is clearer and covers
 * every number. With JS off the grid still fills left to right, which is tidy,
 * just not centred.
 */
( function () {
	'use strict';

	var COLUMNS = 5;

	// Which columns a row of n items should occupy.
	var PLACEMENT = {
		1: [ 3 ],
		2: [ 2, 4 ],
		3: [ 2, 3, 4 ],
		4: [ 1, 2, 4, 5 ],
		5: [ 1, 2, 3, 4, 5 ],
	};

	function layout( grid ) {
		var items = [].slice.call( grid.children );
		if ( ! items.length ) {
			return;
		}

		var fullRows = Math.floor( items.length / COLUMNS );
		var remainder = items.length % COLUMNS;

		items.forEach( function ( item, i ) {
			if ( i < fullRows * COLUMNS ) {
				// A complete row needs no help.
				item.style.gridColumn = '';
				return;
			}
			var posInRow = i - fullRows * COLUMNS;          // 0-based
			var cols = PLACEMENT[ remainder ];
			item.style.gridColumn = cols ? String( cols[ posInRow ] ) : '';
		} );
	}

	function start() {
		var grids = [].slice.call( document.querySelectorAll( '.ug-thumbs' ) );
		grids.forEach( layout );

		// Below the five-column breakpoint the placement is meaningless, and the
		// stylesheet drops it; re-run on resize so it comes back on the way up.
		var timer;
		window.addEventListener( 'resize', function () {
			clearTimeout( timer );
			timer = setTimeout( function () { grids.forEach( layout ); }, 150 );
		}, { passive: true } );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );

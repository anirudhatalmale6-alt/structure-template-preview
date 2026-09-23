/**
 * Scorecard — set the number of players and holes, get a grid to fill in.
 *
 * The client asked whether Elementor could generate the rows and columns from
 * two numbers. It can't: Elementor places elements, it does not create them from
 * input. This is about forty lines of script instead, which does exactly what he
 * described and nothing more — no accounts, no server, no data leaving the
 * phone. Entries are kept in the browser so a round survives a screen lock, and
 * "Neu" clears them.
 *
 * A full scorecard application (saved rounds, sharing, history) is a different
 * job and was quoted separately.
 */
( function () {
	'use strict';

	var STORE = 'ug-scorecard-v1';

	function el( tag, cls, text ) {
		var n = document.createElement( tag );
		if ( cls ) { n.className = cls; }
		if ( text !== undefined ) { n.textContent = text; }
		return n;
	}

	function load() {
		try { return JSON.parse( localStorage.getItem( STORE ) ) || {}; }
		catch ( e ) { return {}; }
	}

	function save( data ) {
		try { localStorage.setItem( STORE, JSON.stringify( data ) ); }
		catch ( e ) { /* private mode: the card still works, it just won't persist */ }
	}

	function build( root ) {
		var state = load();
		var players = parseInt( root.querySelector( '.ug-sc-players' ).value, 10 ) || 4;
		var holes = parseInt( root.querySelector( '.ug-sc-holes' ).value, 10 ) || 9;
		var grid = root.querySelector( '.ug-sc-grid' );

		grid.innerHTML = '';
		var table = el( 'table', 'ug-sc-table' );

		// Header: name, one column per hole, total.
		var thead = el( 'thead' );
		var hrow = el( 'tr' );
		hrow.appendChild( el( 'th', 'ug-sc-name-col', 'Spieler' ) );
		for ( var h = 1; h <= holes; h++ ) {
			hrow.appendChild( el( 'th', null, String( h ) ) );
		}
		hrow.appendChild( el( 'th', 'ug-sc-total-col', 'Gesamt' ) );
		thead.appendChild( hrow );
		table.appendChild( thead );

		var tbody = el( 'tbody' );
		for ( var p = 0; p < players; p++ ) {
			var row = el( 'tr' );

			var nameCell = el( 'td', 'ug-sc-name-col' );
			var name = el( 'input' );
			name.type = 'text';
			name.placeholder = 'Name';
			name.value = ( state.names && state.names[ p ] ) || '';
			name.addEventListener( 'input', persist );
			nameCell.appendChild( name );
			row.appendChild( nameCell );

			for ( var c = 0; c < holes; c++ ) {
				var cell = el( 'td' );
				var score = el( 'input' );
				score.type = 'number';
				score.min = '0';
				score.inputMode = 'numeric';
				score.dataset.player = String( p );
				score.dataset.hole = String( c );
				score.value = ( state.scores && state.scores[ p + ':' + c ] ) || '';
				score.addEventListener( 'input', function () {
					total( this.closest( 'tr' ) );
					persist();
				} );
				cell.appendChild( score );
				row.appendChild( cell );
			}

			row.appendChild( el( 'td', 'ug-sc-total-col ug-sc-total', '0' ) );
			tbody.appendChild( row );
			total( row );
		}
		table.appendChild( tbody );
		grid.appendChild( table );

		function total( tr ) {
			var sum = 0;
			[].forEach.call( tr.querySelectorAll( 'input[type=number]' ), function ( i ) {
				sum += parseInt( i.value, 10 ) || 0;
			} );
			tr.querySelector( '.ug-sc-total' ).textContent = String( sum );
		}

		function persist() {
			var data = { names: [], scores: {}, players: players, holes: holes };
			[].forEach.call( tbody.querySelectorAll( 'tr' ), function ( tr, i ) {
				data.names[ i ] = tr.querySelector( 'input[type=text]' ).value;
				[].forEach.call( tr.querySelectorAll( 'input[type=number]' ), function ( inp ) {
					if ( inp.value !== '' ) {
						data.scores[ inp.dataset.player + ':' + inp.dataset.hole ] = inp.value;
					}
				} );
			} );
			save( data );
		}
	}

	function init( root ) {
		var stored = load();
		if ( stored.players ) { root.querySelector( '.ug-sc-players' ).value = stored.players; }
		if ( stored.holes ) { root.querySelector( '.ug-sc-holes' ).value = stored.holes; }

		root.querySelector( '.ug-sc-make' ).addEventListener( 'click', function () {
			build( root );
		} );
		root.querySelector( '.ug-sc-reset' ).addEventListener( 'click', function () {
			// Clearing is deliberate and destructive, so it asks first.
			if ( window.confirm( 'Alle Eintragungen löschen?' ) ) {
				save( {} );
				build( root );
			}
		} );
		root.querySelector( '.ug-sc-print' ).addEventListener( 'click', function () {
			window.print();
		} );
		build( root );
	}

	function start() {
		[].forEach.call( document.querySelectorAll( '.ug-scorecard' ), init );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );

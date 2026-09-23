/**
 * Course map — OpenStreetMap via Leaflet, with one marker per course.
 *
 * Why not Google Maps: the reference site uses OpenStreetMap, and Google's
 * JavaScript maps now require a billed API key. OpenStreetMap needs no key, no
 * account and no card on file, which matters for a site the client maintains
 * himself.
 *
 * Adding a course is meant to be copy-and-edit, nothing more. In Elementor the
 * map is one HTML widget containing:
 *
 *   <div class="ug-map" data-center="51.2,10.4" data-zoom="6">
 *     <span class="ug-pin"
 *           data-lat="51.4344" data-lng="6.9887"
 *           data-title="Duisburg"
 *           data-url="https://example-tourismus.de/urban-golf"
 *           data-desc="18 Bahnen · Landschaftspark"></span>
 *   </div>
 *
 * Duplicate the <span>, change the five values, done. Everything else — the
 * marker artwork, the popup, the link — is handled here.
 */
( function () {
	'use strict';

	// The golf-player marker, drawn inline so there is no extra image to lose
	// when the site is moved between servers.
	var PIN_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44">' +
		'<circle cx="24" cy="24" r="21" fill="var(--ug-pin-fill, #F3D849)" ' +
		'stroke="var(--ug-pin-stroke, #191718)" stroke-width="3"/>' +
		'<path fill="var(--ug-pin-stroke, #191718)" d="M27.6 12.2a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0zM20.8 17' +
		'c.5-.8 1.5-1.3 2.5-1.2l2.2.3c.9.1 1.6.7 1.9 1.5l2 5.2 4.3 2.4a1.3 1.3 0 0 1-1.2 2.3l-4.8-2.6a2.6 2.6 0 0 1-1.1-1.2' +
		'l-.8-2-1.3 4.6 2.9 3.4c.4.5.6 1.1.5 1.7l-.9 6.2a1.4 1.4 0 0 1-2.8-.3l.8-5.6-3.6-4.2a2.6 2.6 0 0 1-.5-2.4l1-3.6' +
		'-2 1.2-1.5 3a1.3 1.3 0 0 1-2.4-1.1l1.7-3.5c.2-.4.5-.8.9-1l4.2-2.5z"/>' +
		'</svg>';

	function parseLatLng( str, fallback ) {
		if ( ! str ) {
			return fallback;
		}
		var parts = str.split( ',' ).map( function ( n ) { return parseFloat( n.trim() ); } );
		return ( parts.length === 2 && parts.every( isFinite ) ) ? parts : fallback;
	}

	function escapeHtml( s ) {
		return String( s ).replace( /[&<>"']/g, function ( c ) {
			return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ c ];
		} );
	}

	function buildPopup( title, desc, url ) {
		var html = '<strong class="ug-map-title">' + escapeHtml( title ) + '</strong>';
		if ( desc ) {
			html += '<span class="ug-map-desc">' + escapeHtml( desc ) + '</span>';
		}
		if ( url ) {
			// Third-party destination: open in a new tab, and noopener so the
			// opened page cannot reach back into this one.
			html += '<a class="ug-map-link" href="' + escapeHtml( url ) +
				'" target="_blank" rel="noopener noreferrer">Zum Angebot</a>';
		}
		return html;
	}

	function initMap( el ) {
		if ( el.dataset.ugReady ) {
			return;
		}
		el.dataset.ugReady = '1';

		var pins = [].slice.call( el.querySelectorAll( '.ug-pin' ) );
		var centre = parseLatLng( el.dataset.center, [ 51.2, 10.4 ] );
		var zoom = parseInt( el.dataset.zoom, 10 ) || 6;

		// The <span> placeholders are configuration, not content.
		pins.forEach( function ( p ) { p.style.display = 'none'; } );

		var map = L.map( el, {
			center: centre,
			zoom: zoom,
			scrollWheelZoom: false,   // so the page still scrolls over the map
			attributionControl: true,
		} );

		L.tileLayer( 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
		} ).addTo( map );

		var icon = L.divIcon( {
			className: 'ug-map-pin',
			html: PIN_SVG,
			iconSize: [ 44, 44 ],
			iconAnchor: [ 22, 22 ],
			popupAnchor: [ 0, -18 ],
		} );

		var bounds = [];
		pins.forEach( function ( p ) {
			var lat = parseFloat( p.dataset.lat );
			var lng = parseFloat( p.dataset.lng );
			if ( ! isFinite( lat ) || ! isFinite( lng ) ) {
				return;
			}
			bounds.push( [ lat, lng ] );
			L.marker( [ lat, lng ], { icon: icon, title: p.dataset.title || '' } )
				.addTo( map )
				.bindPopup( buildPopup( p.dataset.title || '', p.dataset.desc || '',
					p.dataset.url || '' ) );
		} );

		// Frame whatever markers exist, so adding a course abroad does not leave
		// it off screen. One marker keeps the configured zoom.
		if ( bounds.length > 1 ) {
			map.fitBounds( bounds, { padding: [ 48, 48 ] } );
		} else if ( bounds.length === 1 ) {
			map.setView( bounds[ 0 ], zoom );
		}

		// Elementor reveals sections after load; a map built while hidden
		// measures zero and renders grey until it is told to re-measure.
		setTimeout( function () { map.invalidateSize(); }, 300 );
		window.addEventListener( 'resize', function () { map.invalidateSize(); },
			{ passive: true } );
	}

	function start() {
		if ( typeof L === 'undefined' ) {
			return;
		}
		[].forEach.call( document.querySelectorAll( '.ug-map' ), initMap );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );

/**
 * Hold the photograph still while the page scrolls over it.
 *
 * This is the wildchina effect the client asked for: one picture, standing
 * still behind the page, with the coloured surfaces sliding across it. The
 * windows — the bands that carry images or thumbnails — are where it shows.
 *
 * Why this is not just `background-attachment: fixed`. That property is the
 * textbook answer and it is what the band used to have, but on this page it was
 * painted as if it said `scroll`: the picture travelled with the content, which
 * is exactly what the client kept reporting. The same declaration on a blank
 * page pins correctly, so something in the surrounding document defeats it —
 * a transform, a scroll container, a compositing decision. Rather than keep
 * guessing which, this does the job arithmetically:
 *
 *   the image is scaled to cover the viewport, and every frame its
 *   background-position is offset by the band's distance from the top of the
 *   viewport — so it lands in the same place on screen no matter where the band
 *   has scrolled to.
 *
 * The result is indistinguishable from a fixed background and cannot be undone
 * by a stacking or containing-block rule somewhere up the tree.
 *
 * Without JavaScript the CSS fallback still applies and the picture simply
 * scrolls with its band: less striking, never broken.
 */
( function () {
	'use strict';

	var bands = [];
	var ticking = false;

	function urlOf( el ) {
		var m = /url\(["']?(.*?)["']?\)/.exec( getComputedStyle( el ).backgroundImage );
		return m ? m[ 1 ] : null;
	}

	function resolve( band ) {
		// Elementor lazy-loads container backgrounds — from the fourth
		// top-level container on, the image is not in the computed style until
		// the band has been near the viewport once. Reading it only at startup
		// therefore finds nothing and silently does nothing, which is exactly
		// how this looked the first time round. So keep asking.
		if ( band.natW || band.pending ) {
			return;
		}
		var src = urlOf( band.el );
		if ( ! src ) {
			return;
		}
		band.pending = true;
		band.el.style.backgroundAttachment = 'scroll';
		band.el.style.backgroundRepeat = 'no-repeat';
		var probe = new Image();
		probe.onload = function () {
			band.natW = probe.naturalWidth;
			band.natH = probe.naturalHeight;
			place( band );
		};
		probe.src = src;
	}

	function place( band ) {
		resolve( band );
		if ( ! band.natW ) {
			return;
		}
		var vw = window.innerWidth;
		var vh = window.innerHeight;
		var el = band.el;
		var r = el.getBoundingClientRect();

		// Cover the viewport, keeping the picture's proportions.
		var scale = Math.max( vw / band.natW, vh / band.natH );
		var w = band.natW * scale;
		var h = band.natH * scale;

		// Where the image should sit on screen, then expressed relative to the
		// band — background-position is measured from the element, not the page.
		var screenX = ( vw - w ) / 2;
		var screenY = ( vh - h ) / 2;

		el.style.backgroundSize = Math.round( w ) + 'px ' + Math.round( h ) + 'px';
		el.style.backgroundPosition =
			Math.round( screenX - r.left ) + 'px ' + Math.round( screenY - r.top ) + 'px';
	}

	function onScroll() {
		if ( ticking ) {
			return;
		}
		ticking = true;
		window.requestAnimationFrame( function () {
			bands.forEach( place );
			ticking = false;
		} );
	}

	function start() {
		var els = [].slice.call( document.querySelectorAll( '.ug-open' ) );
		if ( ! els.length ) {
			return;
		}

		// A touch device scrolls with momentum and fires scroll events in
		// bursts, which makes a JS-driven background stutter. There the picture
		// simply scrolls with its band, which is what mobile browsers do with a
		// fixed background anyway.
		if ( window.matchMedia( '(hover: none), (pointer: coarse)' ).matches ) {
			return;
		}

		els.forEach( function ( el ) {
			bands.push( { el: el, natW: 0, natH: 0, pending: false } );
		} );

		window.addEventListener( 'scroll', onScroll, { passive: true } );
		window.addEventListener( 'resize', onScroll, { passive: true } );
		onScroll();
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );

/**
 * Motion for the structural template.
 *
 * Elementor's own motion effects (parallax, sticky, scroll transforms) are a Pro
 * feature, so the following are done here with plain CSS plus one
 * IntersectionObserver and one scroll handler:
 *
 *   1. blocks rise and fade in as they enter the viewport, once each;
 *   2. images drift slightly under the cursor (the effect the client liked on
 *      visitnorway.com);
 *   3. a section's background crossfades between a photograph and a flat colour
 *      as it passes through the viewport (the effect they liked on
 *      wildchina.com);
 *   4. the hero image drifts slower than the page.
 *
 * All of it is skipped for anyone whose system asks for reduced motion. That is
 * an accessibility setting, not a preference — for some people motion causes
 * real nausea — and nothing on the page may depend on an animation having run.
 */
( function () {
	'use strict';

	var reducedQuery = window.matchMedia &&
		window.matchMedia( '(prefers-reduced-motion: reduce)' );
	var reduced = reducedQuery && reducedQuery.matches;

	function showAll() {
		[].forEach.call( document.querySelectorAll( '.ug-reveal' ), function ( n ) {
			n.classList.add( 'is-visible' );
		} );
	}

	/* ------------------------------------------------------------- 1. reveal */

	function initReveal() {
		var targets = [].slice.call( document.querySelectorAll( '.ug-reveal' ) );
		if ( ! targets.length ) {
			return;
		}
		if ( reduced || ! ( 'IntersectionObserver' in window ) ) {
			showAll();
			return;
		}

		var io = new IntersectionObserver( function ( entries ) {
			entries.forEach( function ( entry ) {
				if ( ! entry.isIntersecting ) {
					return;
				}
				entry.target.classList.add( 'is-visible' );
				io.unobserve( entry.target );
			} );
		}, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 } );

		targets.forEach( function ( t ) {
			// Anything already on screen at load is shown without animating —
			// an element animating in while you are already reading it looks
			// like a glitch, not an entrance.
			if ( t.getBoundingClientRect().top < window.innerHeight * 0.85 ) {
				t.classList.add( 'is-visible' );
			} else {
				io.observe( t );
			}
		} );
	}

	/* ----------------------------------------------- 2. images under the cursor */

	function initHoverDrift() {
		if ( reduced ) {
			return;
		}
		// Only for devices that really have a hovering, precise pointer. On a
		// touch screen a tap can emit a synthetic mousemove with no matching
		// mouseleave, which would leave the image stuck at scale(1.08) inside a
		// clipping frame — i.e. permanently cropped. A phone should never run
		// this at all.
		if ( ! ( window.matchMedia &&
			window.matchMedia( '(hover: hover) and (pointer: fine)' ).matches ) ) {
			return;
		}
		var frames = document.querySelectorAll( '.ug-drift' );
		[].forEach.call( frames, function ( frame ) {
			var img = frame.querySelector( 'img' );
			if ( ! img ) {
				return;
			}
			frame.addEventListener( 'mousemove', function ( e ) {
				var r = frame.getBoundingClientRect();
				// -1 .. 1 from the centre of the frame.
				var dx = ( e.clientX - r.left ) / r.width * 2 - 1;
				var dy = ( e.clientY - r.top ) / r.height * 2 - 1;
				// Deliberately small. The image is already scaled up by CSS, so
				// this slides within the frame rather than exposing an edge.
				img.style.transform = 'scale(1.08) translate(' +
					( dx * -1.6 ).toFixed( 2 ) + '%, ' +
					( dy * -1.6 ).toFixed( 2 ) + '%)';
			} );
			frame.addEventListener( 'mouseleave', function () {
				img.style.transform = '';
			} );
		} );
	}

	/* -------------------------------- 3. background: photograph <-> flat colour */

	function initBackdropFade() {
		var zones = [].slice.call( document.querySelectorAll( '.ug-backdrop' ) );
		if ( ! zones.length ) {
			return;
		}
		if ( reduced ) {
			zones.forEach( function ( z ) { z.style.setProperty( '--ug-veil', 1 ); } );
			return;
		}

		var ticking = false;
		function frame() {
			var vh = window.innerHeight;
			zones.forEach( function ( zone ) {
				var r = zone.getBoundingClientRect();
				var centre = r.top + r.height / 2;
				// 1 when the section's centre meets the viewport centre, 0 at
				// either end of the pass.
				var reveal = 1 - Math.min( 1, Math.abs( centre - vh / 2 ) /
					( vh / 2 + r.height / 2 ) );
				// The veil never clears completely — the text has to stay
				// readable over the photograph. 0.62 leaves roughly a third of
				// the colour in place at the most open point, which holds white
				// type against the bright areas of a real photo.
				zone.style.setProperty( '--ug-veil',
					( 1 - reveal * 0.62 ).toFixed( 3 ) );
			} );
			ticking = false;
		}
		window.addEventListener( 'scroll', function () {
			if ( ! ticking ) {
				window.requestAnimationFrame( frame );
				ticking = true;
			}
		}, { passive: true } );
		window.addEventListener( 'resize', frame, { passive: true } );
		frame();
	}

	/* ------------------------------------------------------------ 4. hero drift */

	function initParallax() {
		if ( reduced ) {
			return;
		}
		var hero = document.querySelector( '.ug-parallax' );
		if ( ! hero ) {
			return;
		}
		var ticking = false;
		function frame() {
			var offset = window.pageYOffset || document.documentElement.scrollTop;
			hero.style.backgroundPosition = 'center calc(50% + ' +
				Math.round( offset * 0.18 ) + 'px)';
			ticking = false;
		}
		window.addEventListener( 'scroll', function () {
			if ( ! ticking ) {
				window.requestAnimationFrame( frame );
				ticking = true;
			}
		}, { passive: true } );
		frame();
	}

	function start() {
		initReveal();
		initHoverDrift();
		initBackdropFade();
		initParallax();
	}

	// If the visitor changes the system setting while the page is open, respect
	// it immediately rather than waiting for a reload.
	if ( reducedQuery && reducedQuery.addEventListener ) {
		reducedQuery.addEventListener( 'change', function ( e ) {
			reduced = e.matches;
			if ( reduced ) {
				showAll();
			}
		} );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );

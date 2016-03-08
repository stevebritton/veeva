/*global Zepto, window*/

// Handling tap events can be tricky because 300ms after the cycle of
// touchstart, touchmove, touchend events the browser will send a click event
// to the same position on the screen.
//
// Unfortunately, if the DOM of your page has changed by the time this click
// event fires, it can end up hitting a random button instead of the element
// that used to be there.
//
// To fix this, we use a solution suggested by Google: every time there's a
// tap event that our code handles, we prevent any click events that fire in the
// same place shortly afterwards from having any effect.
//
// NOTE: it seems that even though we are cancelling the click event as soon as
// possible, a link that's under the delayed click will still be marked as
// :active for a few tens of milliseconds. I've tried cancelling mousedown
// events too, but that didn't seem to help.
//
// [1] https://developers.google.com/mobile/articles/fast_buttons#ghost
(function ($) {

	// The space-time coordinates in space-time of the most recent touchend
	// event.  Because touchend doesn't itself have any coordinates, we need to
	// maintain x and y ourselves by listening on touchstart and touchmove.
	var x, y, t;

	window.addEventListener('touchstart', function (e) {
		x = e.touches[0].clientX;
		y = e.touches[0].clientY;
	}, true);

	window.addEventListener('touchmove', function (e) {
		x = e.touches[0].clientX;
		y = e.touches[0].clientY;
	}, true);

	window.addEventListener('touchend', function (e) {
		t = new Date();
	}, true);

	// We only want to cancel the click if some javascript calls
	// .preventDefault() on the tap event (or equivalently returns false from
	// a tap event's handler).
	//
	// Due to limitations of the event model we also cancel the click if
	// javascript calls .stopPropagation(), as the event will not bubble this
	// far. That's probably fine as people rarely distinguish strongly between
	// the two.
	$(window).on('tap doubleTap', function (e) {
		if (!e.defaultPrevented) {
			t = 0;
		}
	});

	// Intercept all clicks on the document, and if they are close in spacetime
	// to a recently handled tap event, prevent them from happening.
	window.addEventListener('click', function (e) {
		// 1000ms is longer than 300ms. Google suggest 2500, but I'm not sure
		// on what basis. That seems unnecessarily long.
		var time_threshold = 1000,
			// 30px is the distance you can move your finger on the iPad before
			// the "tap" does not generate a click.
			// (it's also the threshold used by zepto before a tap becomes a
			// swipe)
			space_threshold = 30;

		if (new Date() - t <= time_threshold &&
			Math.abs(e.clientX - x) <= space_threshold &&
			Math.abs(e.clientY - y) <= space_threshold) {

			e.stopPropagation();
			e.preventDefault();
		}
	}, true);

}(Zepto));
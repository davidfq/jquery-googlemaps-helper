/*!
 *
 * - Load Google Maps API using jQuery Deferred. 
 * - Requires jQuery >= 1.5
 * 
 * based on Glenn Baker's gist
 * https://gist.github.com/828536
 */
/*globals window, google, jQuery*/

var GMaps = (function(window, $) {

	var instance = {},
		now = $.now(),
		deferred = null;

	getDeferred = function() {
		deferred = deferred || $.Deferred();
		return deferred;
	},

	instance.resolve = function() {
		var result = window.google && google.maps ? google.maps : false;
		return getDeferred().resolve(result);
	},

	instance.load = function() {

		// If google.maps exists, then Google Maps API was probably 
		// loaded with the 'script' tag
		if (window.google && google.maps) {
			this.resolve();
		} else {
			// global callback name
			var callbackName = "loadGoogleMaps_" + (now++);
			// declare the global callback
			window[callbackName] = function() {
				// resolve deferred object
				GMaps.resolve();
				// delete callback
				setTimeout(function() {
					try {
						delete window[callbackName];
					} catch(e) {}
				},
				20);
			};

			// can't use the jXHR promise because 'script' doesn't 
			// support 'callback=?'
			$.ajax({
				dataType: 'script',
				data: {
					'sensor': false,
					'callback': callbackName
				},
				url: 'http://maps.google.com/maps/api/js'
			});

		}
		return getDeferred().promise();
	};

	instance.map = function(domId, opts) {
		if (typeof opts.center === 'undefined' || typeof opts.center.lat === 'undefined') {
			return;
		}
		var map = document.getElementById(domId),
			myOptions = {
			zoom: (opts && opts.zoom) || 8,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			center: new google.maps.LatLng(opts.center.lat, opts.center.lng)
		};
		return new google.maps.Map(map, myOptions);
	};

	instance.marker = function(gmap, poi, clickHandler) {
		var marker = new google.maps.Marker({
			map: gmap,
			title: (poi && poi.title) || poi.lat + ', ' + poi.lng,
			draggable: false,
			position: new google.maps.LatLng(poi.lat, poi.lng)
		});
		if (typeof clickHandler !== 'undefined') {
			google.maps.event.addListener(marker, 'click', clickHandler);
		}
		return marker;
	};

	instance.markers = function(gmap, pois, clickHandler) {
		if (!$.isArray(pois) || pois.length === 0) {
			return;
		}
		var _l = pois.length,
			bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < _l; i++) {
			bounds.extend(this.marker(gmap, pois[i], clickHandler).getPosition());
		}
		gmap.fitBounds(bounds);
	};

	return instance;

})(window, jQuery);

/*!
 *
 * - Load Google Maps API using jQuery Deferred. 
 * - Requires jQuery >= 1.5
 * 
 * based on Glenn Baker's gist
 * https://gist.github.com/828536
 */
/*globals window, google, jQuery*/
;
var GMaps = (function(window, $) {

	var instance = {},
		now = $.now(),
		deferred = null,
		gmaps = {};

	_getDeferred = function() {
		deferred = deferred || $.Deferred();
		return deferred;
	},

	_setMap = function(map, markers){
		gmaps[map.getDiv().id] = { 
			gmap : map,
			gmarkers : markers || []
		};	
	};

	_unsetMap = function(id){
		delete gmaps[id];
	}

	_setMarker = function(map, marker){
		var id = map.getDiv().id;
		if(typeof gmaps[id] !== 'undefined'){
			gmaps[id].gmarkers.push(marker);
		}else{
			_setMap(map, [marker]);
		}
	};

	instance.resolve = function() {
		var result = window.google && google.maps ? google.maps : false;
		return _getDeferred().resolve(result);
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
				}, 20);
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
		return _getDeferred().promise();
	};

	instance.setMap = function(domId, opts) {
		if (typeof opts.center === 'undefined' || typeof opts.center.lat === 'undefined') {
			return;
		}

		var map = document.getElementById(domId),
			myOptions = {
				zoom: (opts && opts.zoom) || 8,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: new google.maps.LatLng(opts.center.lat, opts.center.lng) 
			},
			newMap = new google.maps.Map(map, myOptions);
		
		_setMap(newMap);
		return newMap;
	};

	instance.setMarker = function(gmap, poi, clickHandler) {
		var marker = new google.maps.Marker({
			map: gmap,
			title: (poi && poi.title) || poi.lat + ', ' + poi.lng,
			draggable: false,
			position: new google.maps.LatLng(poi.lat, poi.lng)
		});
		if ($.isFunction(clickHandler)) {
			google.maps.event.addListener(marker, 'click', clickHandler);
		}
		_setMarker(gmap, marker);
		return marker;
	};

	instance.setMarkers = function(gmap, pois, clickHandler) {
		if (!$.isArray(pois) || pois.length === 0) {
			return;
		}
		var _l = pois.length,
			bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < _l; i++) {
			bounds.extend(this.setMarker(gmap, pois[i], clickHandler).getPosition());
		}
		gmap.fitBounds(bounds);
	};
	
	instance.getMap = function(id){
		return gmaps[id];
	}
	
	instance.clearMarkers = function(map){
	  var id = map.gmap.getDiv().id;
	  if(typeof gmaps[id] === 'undefined'){
			return;
		}
		var markers = gmaps[id].gmarkers;
		for(var i = 0; i < markers.length; i++){
			markers[i].setMap(null);
		}
		gmaps[id].gmarkers = [];
	};

	return instance;

}(window, jQuery));

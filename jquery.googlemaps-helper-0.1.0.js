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
		  gmaps = {},
      API_URL = 'http://maps.google.com/maps/api/js';

	var _getDeferred = function() {
		deferred = deferred || $.Deferred();
		return deferred;
	};

	var _addMap = function(map, markers, fit){
		var newMap = { 
			gmap : map,
			gmarkers : markers || [],
			fitBounds : fit
		};	
		gmaps[map.getDiv().id] = newMap;
		return newMap;
	};

	instance.resolve = function() {
		var result = window.google && google.maps ? google.maps : false;
		return _getDeferred().resolve(result);
	};

	instance.load = function(key, client) {

		// If google.maps exists, then Google Maps API was probably 
		// loaded with the `script` tag
		if (window.google && google.maps) {
			this.resolve();
		} else {

			var callbackName = "loadGoogleMaps_" + (now++),  // global callback name
           params = {
            sensor : navigator && navigator.geolocation ? true : false,
            callback : callbackName
           };

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

      params = $.extend(params, { 
        key : key || {},  
        client : client || {}
      });

			// can't use the jXHR promise because 'script' doesn't 
			// support 'callback=?'
			$.ajax({
				dataType: 'script',
				data: params,
				url: API_URL
			});

		}
		return _getDeferred().promise();
	};

	instance.newMap = function(domId, opts) {
	  // can't create a map without center
		if (typeof opts.center === 'undefined' || typeof opts.center.lat === 'undefined') {
			return;
		}
    // TODO mapOptions is messed up!! FIX IT!
		var mapDiv = document.getElementById(domId),
			myOptions = {
				zoom : (opts && opts.zoom) || 8,
        draggable : opts && opts.draggable,
        disableDefaultUI : opts && opts.disableDefaultUI,
        styles : opts && opts.styles, 
				mapTypeId : (opts && opts.mapType) || google.maps.MapTypeId.ROADMAP,
				center : new google.maps.LatLng(opts.center.lat, opts.center.lng) 
			},
			newMap = new google.maps.Map(mapDiv, myOptions);
		
		return _addMap(newMap, null, (opts && opts.fitBounds) || false);  
	};

	instance.setMarker = function(domId, poi, clickHandler) {
	  var map = this.getMap(domId);
	  if(!map){
	    return;
	  }
    var markerOpts = {
			map: map.gmap,
			draggable: false,
			position: new google.maps.LatLng(poi.lat, poi.lng)
		};

    if(poi.icon){
      $.extend(markerOpts, { icon : poi.icon });
    }

    if(poi.title){
      $.extend(markerOpts, { title : poi.title });
    }

		var marker = new google.maps.Marker(markerOpts);
		if ($.isFunction(clickHandler)) {
			google.maps.event.addListener(marker, 'click', clickHandler);
		}
    // custom data property which holds ref to poi
    // useful when accessing data from clickHandler    
    marker.data = poi;
    map.gmarkers.push(marker);
    return marker;
	};

	instance.setMarkers = function(domId, pois, clickHandler) {
	  var map = this.getMap(domId);
		if (!$.isArray(pois) || pois.length === 0) {
			return;
		}
		var _l = pois.length,
			bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < _l; i++) {
		  var m = this.setMarker(domId, pois[i], clickHandler);
		  bounds.extend(m.getPosition());
		}
		if(map.fitBounds){
		  map.gmap.fitBounds(bounds);
		}
	};
	
	instance.getMap = function(domId){
		return gmaps[domId];
	};
	
	instance.clearMarkers = function(domId){
	  var map = this.getMap(domId);
	  if(!map){
	    return;
	  }
		for(var i = 0; i < map.gmarkers.length; i++){
			map.gmarkers[i].setMap(null);
		}
		map.gmarkers = [];
	};

	return instance;

}(window, jQuery));

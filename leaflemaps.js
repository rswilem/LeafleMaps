var tileURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
var mapboxKey = "";
function main(currentScriptElement) {
  injectHead(function() {
    var queryString = currentScriptElement.src.replace(/^[^\?]+\??/,'');

    var requestedTileURL = currentScriptElement.getAttribute("tileurl");
    if (requestedTileURL && requestedTileURL.length > 0) {
      tileURL = requestedTileURL;
    }

    var requestedMapboxKey = currentScriptElement.getAttribute("mapboxkey");
    if (requestedMapboxKey && requestedMapboxKey.length > 0) {
      mapboxKey = requestedMapboxKey;
    }

    var callbackFunction = _getQueryVariable(queryString, "callback");
    if (callbackFunction && callbackFunction.length > 0) {
      window[callbackFunction]();
    }
  }.bind(this));
}

function _getQueryVariable(query, variable)
{
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
}

var _addDomListener = function(targetObject, event, callback) {
  targetObject["on" + event] = function() {
    setTimeout(function() {
      callback();
    }.bind(this), 200);
  }.bind(this);
}

var _addListener = function(targetObject, event, callback) {
  if (targetObject["__ismarker"]) {
    targetObject.addListener(event, callback);
  }
}

var _map = function(domObject, mapParameters) {
  //center, zoom, minZoom, disableDefaultUI, styles
  this.map = L.map(domObject.id, {zoomControl: !mapParameters.disableDefaultUI}).setView([mapParameters.center.lat, mapParameters.center.lng], mapParameters.zoom);

  var parameters = {
    attribution: '<a href="https://www.maptiler.com/license/maps/" target="_blank">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>',
    crossOrigin: true,
  };

  if (mapParameters.minZoom) {
    parameters.minZoom = mapParameters.minZoom;
  }
  if (mapParameters.maxZoom) {
    parameters.maxZoom = mapParameters.maxZoom;
  }

  L.tileLayer(tileURL, parameters).addTo(this.map);

  if (mapParameters.styles) {
    console.debug("[LeafleMaps] Map styles are not implemented yet.");
  }

  this.map.setCenter = function() {
    console.debug("[LeafleMaps] map.setCenter not implemented yet.");
  };

  this.map.setPosition = function() {
    console.debug("[LeafleMaps] map.setPosition not implemented yet.");
  };

  if (mapParameters.scrollwheel) {
    this.map.scrollWheelZoom.enable();
  }
  else {
    this.map.scrollWheelZoom.disable();
  }

  if (mapParameters.draggable) {
    this.map.dragging.enable();
  }
  else {
    this.map.dragging.disable();
  }

  return this.map;
};

var _marker = function(markerParameters) {
  var latitude = markerParameters.position.lat || 0;
  var longitude = markerParameters.position.lng || 0;

  var marker = L.marker([latitude, longitude]).addTo(markerParameters.map);
  marker.latlng = [latitude, longitude];
  marker.position = L.latLng(latitude, longitude);

  if (markerParameters.icon)
  {
    if (!markerParameters.icon.url) {
      var iconUrl = markerParameters.icon
      markerParameters.icon = {url: iconUrl};
    }

    var iconParams = {
      iconUrl: markerParameters.icon.url
    };

    iconParams.iconSize = [20, 20];
    var imgElement = document.createElement('img');
    imgElement.onload = function () {
      var offset = markerParameters.icon.origin || [0, 0];
      iconParams.iconAnchor = [(imgElement.width / 2) + offset[0], (imgElement.height / 2) + offset[1]];
      iconParams.iconSize = [imgElement.width, imgElement.height];

      var icon = new L.icon(iconParams);
      marker.setIcon(icon);
    };
    imgElement.src = markerParameters.icon.url;

    var icon = new L.icon(iconParams);
    marker.setIcon(icon);
  }

  if (markerParameters.animation) {
    console.debug("[LeafleMaps] Marker animations are not supported yet.");
  }

  marker.addListener = function(event, callback) {
    marker.on(event, callback.bind(this.marker));
  };

  marker.__ismarker = true;
  return marker;
};

var _infowindow = function(infoParameters) {
  var popup = L.popup({offset: [1, -20]});
  popup.setContent(infoParameters.content);
  popup.open = function(map, marker) {
    //marker.bindPopup(this.content).openPopup();
    popup.setLatLng(marker.latlng).openOn(map);
  }.bind(this);

  return popup;
};

var _coordinate = function(latitude, longitude) {
  return L.latLng(latitude, longitude);
};

var _coordinateBounds = function(firstCoordinate, secondCoordinate) {
  return L.latLngBounds(firstCoordinate, secondCoordinate);
}

var _coordinatePoint = function(x, y) {
  return L.point(x,y);
}

var _directionsService = function() {
  return {route: _directionsServiceRoute };
}

var _directionsServiceRoute = function(routeRequest, callback) {
  if (!mapboxKey) {
    return;
  }

  var locations = [];
  locations.push(routeRequest.origin);
  for (var i = 0; i < routeRequest.waypoints.length; i++) {
    var location = routeRequest.waypoints[i];
    locations.push(location.location);
  }
  locations.push(routeRequest.destination);

  var mapboxRouter = L.Routing.mapbox(mapboxKey);
  mapboxRouter.options.profile = 'mapbox/walking';

  var routingControl = L.Routing.control({
    waypoints: locations,
    show: false,
    router: mapboxRouter,
    createMarker: function() {}
  });

  callback(routingControl, google.maps.DirectionsStatus.OK)
}

var _directionsRenderer = function(options) {
  //TODO: suppressMarkers, routeIndex, preserveViewport

  var mapReference = false;
  var controlReference = false;
  var finishedBlock = function() {
    if (mapReference && controlReference)
    {
      if (options.polylineOptions)
      {
        controlReference.options.lineOptions = {};

        if (options.polylineOptions.strokeColor) {
          controlReference.options.lineOptions.styles = [{color: options.polylineOptions.strokeColor, opacity: 1, weight: 5}];
        }
      }

      controlReference.addTo(mapReference);
    }
  }.bind(this);

  this.setMap = function(map) {
    mapReference = map;
    finishedBlock();
  }.bind(this);

  this.setDirections = function(routingControl) {
    controlReference = routingControl;
    finishedBlock();
  }.bind(this);

  return this;
}

var _travelMode = function() {
  console.debug("[LeafleMaps] TravelMode not implemented yet.");

  return {};
}

function injectHead(completion) {
  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)){ return; }
      js = d.createElement('style'); js.id = id;
      js.innerHTML = ".leaflet-routing-container-hide { display: none; } .leaflet-container {z-index: 0}";
      fjs.appendChild(js, fjs);
  }(document, 'head', 'custom-css'));

  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)){ return; }
      js = d.createElement('link'); js.id = id;
      js.onload = function(){
          // remote css has loaded
      };
      js.rel = "stylesheet";
      js.href = "//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.css";
      fjs.appendChild(js, fjs);
  }(document, 'head', 'leaflet-css'));

  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)){ return; }
      js = d.createElement('link'); js.id = id;
      js.onload = function(){
          // remote css has loaded
      };
      js.rel = "stylesheet";
      js.href = "//unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css";
      fjs.appendChild(js, fjs);
  }(document, 'head', 'leaflet-routing-css'));

  var scriptSemaphore = 0;
  var scriptFinished = function() {
    scriptSemaphore--;

    if (scriptSemaphore <= 0) {
      completion();
    }
  };

  scriptSemaphore++;
  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)){ return; }
      js = d.createElement(s); js.id = id;
      js.onload = function(){
        scriptFinished();
      };
      js.src = "//cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/leaflet.js";
      fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'leaflet-jssdk'));

  scriptSemaphore++;
  (function(d, s, id){
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)){ return; }
      js = d.createElement(s); js.id = id;
      js.onload = function(){
        scriptFinished();
      };
      js.src = "//unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js";
      fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'leaflet-routing-jssdk'));
}

/* Exported object */
var google = {
  maps: {
    event: { addDomListener: _addDomListener.bind(this), addListener: _addListener.bind(this) },
    Map: _map.bind(this),
    Marker: _marker.bind(this),
    InfoWindow: _infowindow.bind(this),
    LatLng: _coordinate.bind(this),
    LatLngBounds: _coordinateBounds.bind(this),
    Point: _coordinatePoint.bind(this),
    DirectionsService: _directionsService.bind(this),
    DirectionsRenderer: _directionsRenderer.bind(this),
    TravelMode: _travelMode.bind(this),
    Animation: {
      NORMAL: "NORMAL",
      NONE: "NONE",
      DROP: "DROP",
      BOUNCE: "BOUNCE"
    },
    DirectionsStatus: {
      OK: "OK",
      NOT_FOUND: "NOT_FOUND",
      ZERO_RESULTS: "ZERO_RESULTS",
      MAX_WAYPOINTS_EXCEEDED: "MAX_WAYPOINTS_EXCEEDED",
      MAX_ROUTE_LENGTH_EXCEEDED: "MAX_ROUTE_LENGTH_EXCEEDED",
      INVALID_REQUEST: "INVALID_REQUEST",
      OVER_QUERY_LIMIT: "OVER_QUERY_LIMIT",
      REQUEST_DENIED: "REQUEST_DENIED",
      UNKNOWN_ERROR: "UNKNOWN_ERROR"
    }
  }
};

var currentScriptElement = document.currentScript || false;
if (!currentScriptElement)
{
    var scripts = document.getElementsByTagName('script');
    var index = scripts.length - 1;
    currentScriptElement = scripts[index];
}
main(currentScriptElement);

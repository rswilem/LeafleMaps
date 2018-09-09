## LeafleMaps
LeafleMaps is a drop in replacement for the 'Google Maps JavaScript API v3'.

\* Work in progress, feel free to contribute \*

#### Minimal implementation
Change your current script tag with the script tag below, and a LeafletJS map with OpenStreetMap tiles will show up.
```html
<script type="text/javascript" src="leaflemaps.js"></script>
```

#### JSONP Callback
LeafleMaps supports a JSONP like callback using the `callback` query parameter. In order to call the function `initMap` upon page load, configure your script tag as follows:
```html
<script type="text/javascript" src="leaflemaps.js?callback=initMap"></script>
```

#### Customizing map tiles
By default, LeafleMaps uses OpenStreetMap tiles to render the map. LeafleMaps has support for custom map tiles. Simply add the `tileurl` parameter to your script tag, like in the example below.
```html
<script type="text/javascript" src="leaflemaps.js" tileurl="https://maps.tilehosting.com/styles/basic/{z}/{x}/{y}.png?key=MAP_TILE_API_KEY"></script>
```

#### Directions API
If you happen to use Google's `DirectionsRenderer` in your implementation, LeafleMaps will use the MapBox service to aquire the same result. (https://www.mapbox.com)
A MapBox API key will be mandatory for this function to work. Mapbox API keys are passed to LeafleMaps as follows:
```html
<script type="text/javascript" src="leaflemaps.js" mapboxkey="MAPBOX_KEY_FOR_DIRECTIONS_API"></script>
```

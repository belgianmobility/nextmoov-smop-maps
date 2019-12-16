[< Back to general](https://github.com/nextmoov/nextmoov-smop-general)

# SMOP - Maps

Vector tiles service compatible with Mapbox GL js.

#### illustration
<img width="675" alt="Screenshot 2019-12-16 at 13 37 24" src="https://user-images.githubusercontent.com/10850995/70907760-00004180-200a-11ea-8d0e-8a9f54c97896.png">


## Modules

### Importer

Acquire OSM pbf file from Geofabrik and uses imposm to import OpenStreetMap (OSM) pbf file into a Postgresql database with Postgis extension enabled.

### Server

The base url of the tiles is http://localhost:8080/tiles

All kind of items are available on separated routes prfixed by the "base url" :

* /waterways/{z}/{x}/{y}.pbf
* /waterareas/{z}/{x}/{y}.pbf
* /landusages/{z}/{x}/{y}.pbf
* /aeroways/{z}/{x}/{y}.pbf
* /transport_areas/{z}/{x}/{y}.pbf

* /roads/{z}/{x}/{y}.pbf
* /admin/{z}/{x}/{y}.pbf
* /housenumbers/{z}/{x}/{y}.pbf
* /buildings/{z}/{x}/{y}.pbf
* /amenities/{z}/{x}/{y}.pbf
* /places/{z}/{x}/{y}.pbf

Known issues : the server does not refresh already cached tiles.

You can clear the cache by issuing `docker-compose exec maps-server /app/clear_cache`.

### Database

A Dockerfile is provided to build a compatible database service.

[< Back to general](https://github.com/nextmoov/nextmoov-smop-general)

# SMOP - Maps

Vector tiles service compatible with [Mapbox GL js](https://github.com/mapbox/mapbox-gl-js).


## Requirements
  - docker


## Running the service
- clone the repo  
   `git clone git@github.com:nextmoov/nextmoov-smop-maps.git`
- move into the created folder   
   `cd nextmoov-smop-maps`
- run via docker-compose  
  `docker-compose up`


## Architecture
![Software Architecture - Map server_](https://user-images.githubusercontent.com/10850995/70332430-d5f89380-1841-11ea-8d34-812969f6a27d.jpg)


## Modules

### Importer

Acquire OSM pbf file from Geofabrik and uses [imposm](https://imposm.org/) to import [OpenStreetMap (OSM) pbf file](https://wiki.openstreetmap.org/wiki/PBF_Format) into a Postgresql database with [Postgis extension](https://postgis.net/) enabled.

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

[< Back to general](https://github.com/nextmoov/nextmoov-smop-general)

# SMOP - Maps

Vector tiles service compatible with [Mapbox GL js](https://github.com/mapbox/mapbox-gl-js).


## Requirements
  - docker
  - docker-compose


## Running the service
- clone the repo  
   `git clone git@github.com:nextmoov/nextmoov-smop-maps.git`
- move into the created folder   
   `cd nextmoov-smop-maps`
- run via docker-compose  
  `docker-compose up`


## Architecture
![Software Architecture - Map server_](https://user-images.githubusercontent.com/10850995/70332430-d5f89380-1841-11ea-8d34-812969f6a27d.jpg)


#### illustration
<img width="675" alt="Screenshot 2019-12-16 at 13 37 24" src="https://user-images.githubusercontent.com/10850995/70907760-00004180-200a-11ea-8d0e-8a9f54c97896.png">


## Modules

### Importer

The importer will acquire an [osm.pbf](https://wiki.openstreetmap.org/wiki/PBF_Format) file (defined in [importer/config.js](importer/config.js#L2), currently set on belgium-latest.osm.pbf from Geofabrik – see [General - Data](https://github.com/nextmoov/nextmoov-smop-general#maps) for more information).


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

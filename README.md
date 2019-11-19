# SMOP - Maps

General information : [nextmoov-smop-general](https://github.com/nextmoov/nextmoov-smop-general)

Vector tiles service compatible with Mapbox GL js.

## How to use

All modules provides a Dockerfile for easy startup:

```
docker-compose up
```

Tested with docker-compose version 1.21.0.


## Modules

### Importer

Acquire OSM pbf file from Geofabrik and uses imposm to import OpenStreetMap (OSM) pbf file into a Postgresql database with Postgis extension enabled.

### Server

Known issue : the server does not refresh already cached tiles.

### Database

A Dockerfile is provided to build a compatible database service.

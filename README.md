[< Back to general](https://github.com/nextmoov/nextmoov-smop-general)

# SMOP - Maps

Vector tiles service compatible with Mapbox GL js.

## Modules

### Importer

Acquire OSM pbf file from Geofabrik and uses imposm to import OpenStreetMap (OSM) pbf file into a Postgresql database with Postgis extension enabled.

### Server

Known issues : the server does not refresh already cached tiles.

You can clear the cache by issuing `docker-compose exec maps-server /app/clear_cache`.

### Database

A Dockerfile is provided to build a compatible database service.

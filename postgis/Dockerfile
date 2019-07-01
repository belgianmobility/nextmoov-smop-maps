FROM postgres:11

ENV POSTGRES_USER gis

RUN apt-get -y update && apt-get install -y \
postgresql-11-postgis-2.5 && \
apt-get clean && rm -rf /var/lib/apt/lists/*

COPY ./files/initdb-postgis.sh /docker-entrypoint-initdb.d/postgis.sh

WORKDIR /

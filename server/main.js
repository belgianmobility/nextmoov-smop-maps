
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Pool: PgPool } = require('pg');
const SphericalMercator = require('@mapbox/sphericalmercator');
const mkdirp = require('mkdirp');

const CONFIG = require('./config');


const sphericalMercator = new SphericalMercator({
  size: 4096,
});

const pgPool = new PgPool({
  connectionString: CONFIG.postgisConnection,
  min: 25,
  max: 50,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 60000,
});


async function getPgMtime(pgClient) {
  let ret = null;

  try {
    const res = await pgClient.query(`
      SELECT value
      FROM meta
      WHERE key = 'mtime'
    `);

    ret = parseInt(res.rows[0].value, 10);
  } catch (err) {
    console.log('ERROR', err);
  }

  return ret;
}

function genQuery(type, x, y, z) {
  // ----- Additionnal columns.
  const typeColumns = {
    roads: "tunnel, bridge, oneway, NULLIF(name_fr, '') as name_fr, NULLIF(name_nl, '') as name_nl, NULLIF(name_de, '') as name_de, NULLIF(name_en, '') as name_en,",
    admin: 'maritime, admin_level,',
    places: "NULLIF(name_fr, '') as name_fr, NULLIF(name_nl, '') as name_nl, NULLIF(name_de, '') as name_de, NULLIF(name_en, '') as name_en,",
  };

  let addFields = '';

  if (typeColumns.hasOwnProperty(type)) {
    addFields = typeColumns[type];
  }

  // ----- Filter by zoom level.
  let extraWhere = '';

  if (type === 'roads') {
    if (z < 8) {
      extraWhere += " AND type NOT in ('primary', 'rail') ";
    }

    if (z < 12) {
      extraWhere += " AND type NOT in ('residential', 'secondary', 'tertiary') ";
    }

    if (z < 13) {
      extraWhere += " AND type NOT in ('trunk', 'trunk_link', 'groyne', 'path', 'cycleway', 'footway', 'steps', 'bridleway', 'pier', 'track', 'service', 'primary_link', 'secondary_link', 'tertiary_link', 'tram', 'pedestrian', 'road', 'living_street', 'unclassified') ";
    }
  } else if (type === 'places') {
    if (z < 9) {
      extraWhere += " AND type in ('country', 'city', 'suburb') ";
    } else if (z < 11) {
      extraWhere += " AND type in ('country', 'city', 'suburb', 'town') ";
    } else if (z < 13) {
      extraWhere += " AND type in ('country', 'city', 'suburb', 'town', 'hamlet') ";
    } else {
      extraWhere += " AND type in ('country', 'city', 'suburb', 'town', 'hamlet', 'village', 'locality') ";
    }
  } else if (['landusages', 'waterareas', 'waterways'].includes(type)) {
    if (z < 9) {
      extraWhere += ' AND ST_Area(d.geometry) > 400000.0 ';
    } else if (z < 10) {
      extraWhere += ' AND ST_Area(d.geometry) > 200000.0 ';
    } else if (z < 11) {
      extraWhere += ' AND ST_Area(d.geometry) > 100000.0 ';
    } else if (z < 12) {
      extraWhere += ' AND ST_Area(d.geometry) > 50000.0 ';
    }
  }

  // ----- Convert tiles coordinates to postgis coordinate enveloppe.
  const wsen = sphericalMercator.bbox(x, y, z, false, '900913');

  return `
    SELECT ST_AsMVT(q, '${type}', 4096, 'geom')
    FROM (
      SELECT
        d.name, d.type, ${addFields}
        ST_AsMvtGeom(d.geometry, bb.geom, 4096, 256, true) AS geom
      FROM
        osm_${type} d, (SELECT ST_MakeEnvelope(${wsen[0]}, ${wsen[3]}, ${wsen[2]}, ${wsen[1]}, 3857) AS geom) bb
      WHERE
        ST_Intersects(d.geometry, bb.geom) ${extraWhere}
    ) AS q;
  `;
}

async function serverTile(res, request, response) {
  const pgClient = await pgPool.connect();

  // ---- Check mtime from database.
  const pgMtime = await getPgMtime(pgClient);

  let done = false;

  if (request.headers['if-modified-since']) {
    const remoteMTime = new Date(request.headers['if-modified-since']).getTime();

    if (remoteMTime === pgMtime) {
      response.writeHead(304, {
        'Access-Control-Allow-Origin': '*',
        'Last-Modified': new Date(pgMtime).toUTCString(),
      });

      response.end();

      done = true;
    }
  }

  if (!done) {
    const {
      type, x, y, z,
    } = res.groups;

    // ----- Check if tile is already in the cache.
    const tilePath = path.join(CONFIG.cacheDir, `${type}/${z}/${x}/${y}.pbf`);

    if (fs.existsSync(tilePath)) {
      // ----- Send cached tile to to client.
      const data = fs.readFileSync(tilePath);

      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
        'Access-Control-Allow-Origin': '*',
        'From-Cache': true,
        'Last-Modified': fs.statSync(tilePath).mtime.toUTCString(),
      });

      response.end(data, 'binary');
    } else {
      // ----- Get tile data from database.
      const pgRes = await pgClient.query(genQuery(type, x, y, z));
      const data = pgRes.rows[0].st_asmvt;

      // ----- Send answer to client.
      response.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': data.length,
        'Access-Control-Allow-Origin': '*',
        'From-Cache': false,
        'Last-Modified': new Date(pgMtime).toUTCString(),
      });

      response.end(data, 'binary');

      // ----- Save generated tile in cache.
      // Temporary name in case we have concurrent connection asking for the same tile.
      const tmpTilePath = `${tilePath}.tmp_${new Date().getTime()}`;

      mkdirp.sync(path.dirname(tilePath));
      fs.writeFileSync(tmpTilePath, data, { encoding: 'binary' });
      fs.renameSync(tmpTilePath, tilePath);
    }
  }

  await pgClient.release();
}

async function serveOceans(res, request, response) {
  // Data based on Natural Earth Data.
  const filePath = './oceans.geojson';

  const { size, mtime } = fs.statSync(filePath);

  // ----- Send answer to client.
  response.writeHead(200, {
    'Content-Type': 'application/geo+json',
    'Content-Length': size,
    'Access-Control-Allow-Origin': '*',
    'Last-Modified': mtime,
  });

  fs.createReadStream(filePath).pipe(response);
}

const controllers = [
  [/\/tiles\/(?<type>[a-z0-9_]+)\/(?<z>[0-9]+)\/(?<x>[0-9]+)\/(?<y>[0-9]+).pbf/, serverTile],
  [new RegExp('^/oceans.geojson$'), serveOceans],
];

http.createServer(async (request, response) => {
  try {
    let done = false;

    for (const controller of controllers) {
      const res = controller[0].exec(request.url);
      if (res) {
        await controller[1](res, request, response);
        done = true;
        break;
      }
    }

    if (!done) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end(`404 ${http.STATUS_CODES[404]}`);
    }
  } catch (e) {
    console.log(e);

    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end(':-(');
  }
}).listen(CONFIG.serverPort);

console.log(`Server running on port ${CONFIG.serverPort}...`);

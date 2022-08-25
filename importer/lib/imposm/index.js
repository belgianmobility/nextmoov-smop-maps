
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { Client: PgClient } = require('pg');

const logger = require('../logger');
const CONFIG = require('../../config');


function spawnImposm(args, loggerStream = null) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    const imposmProcess = spawn(
      CONFIG.imposmExecutablePath,
      args,
    );

    imposmProcess.on('error', (err) => {
      reject(err);
    });

    imposmProcess.stdout.on('data', (data) => {
      stdout = data.toString();
    });

    if (loggerStream !== null) {
      imposmProcess.stdout.pipe(loggerStream);
      imposmProcess.stderr.pipe(loggerStream);
    }

    imposmProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(code);
      }
    });
  });
}

async function setPgMtime(mtime) {
  // Save the mofication time of the imported file to avoid reimporting if already up to date and
  // used by the server to provide the 'Last-Modified' http header.
  const pgClient = new PgClient({ connectionString: CONFIG.postgisConnection });
  await pgClient.connect();

  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS meta (
      key varchar(255) NOT NULL,  
      value varchar(255) NOT NULL
    );
  `);

  await pgClient.query("DELETE FROM meta WHERE key = 'mtime';");

  await pgClient.query(`
    INSERT INTO meta VALUES ('mtime', $1);
  `, [mtime]);

  await pgClient.end();
}

async function importOceansData(data) {
  const pgClient = new PgClient({ connectionString: CONFIG.postgisConnection });
  await pgClient.connect();

  await pgClient.query(`
    INSERT INTO import.osm_waterareas(geometry, name, type) 
    VALUES(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 3857), 'oceans', 'oceans');
  `, [data]);

  await pgClient.end();
}

async function importOsmFile() {
  const mappingFile = path.join(path.dirname(module.filename), 'mapping.yml');

  logger.info(`Reading ${CONFIG.osmFilePath}...`);

  await spawnImposm([
    'import',
    '-mapping', mappingFile,
    '-cachedir', CONFIG.cacheDir,
    '-read', CONFIG.osmFilePath,
    '-overwritecache',
  ], fs.createWriteStream(CONFIG.imposmLogFilePath, { flags: 'w' }));

  logger.info('Writing to DB...');

  await spawnImposm([
    'import',
    '-mapping', mappingFile,
    '-cachedir', CONFIG.cacheDir,
    '-write',
    '-connection', CONFIG.postgisConnection,
  ], fs.createWriteStream(CONFIG.imposmLogFilePath, { flags: 'a' }));

  logger.info('Deploy production tables...');

  await spawnImposm([
    'import',
    '-mapping', mappingFile,
    '-connection', CONFIG.postgisConnection,
    '-deployproduction',
  ], fs.createWriteStream(CONFIG.imposmLogFilePath, { flags: 'a' }));


  const stat = fs.statSync(CONFIG.osmFilePath);
  await setPgMtime(stat.mtime);

  // TODO Synchronize with the clearing of the cache of the server.
}

module.exports = importOsmFile;

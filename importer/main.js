
const logger = require('./lib/logger');
const downloadOsmFile = require('./lib/downloader');
const importOsmFile = require('./lib/imposm');


async function main() {
  try {
    logger.info('Downloading OSM file...');
    await downloadOsmFile();

    logger.info('Importing OSM file...');
    await importOsmFile();
  } catch (err) {
    logger.error(err);
  }
}

main().then(() => { logger.info('That\'s all folks!'); });

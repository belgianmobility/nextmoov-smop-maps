
const http = require('http');
const fs = require('fs');

const CONFIG = require('../../config');


function download() {
  return new Promise((resolve, reject) => {
    const req = http.request(CONFIG.remoteOsmUrl, { method: 'GET' }, (res) => {
      res
        .pipe(fs.createWriteStream(CONFIG.osmFilePath))
        .on('close', () => {
          if (res.headers['last-modified']) {
            const dt = new Date(res.headers['last-modified']);
            fs.utimesSync(CONFIG.osmFilePath, dt, dt);
          }

          resolve();
        })
        .on('error', reject);
    });

    req.end();
  });
}

function downloadOsmFile() {
  return new Promise((resolve, reject) => {
    try {
      const stat = fs.statSync(CONFIG.osmFilePath);
      const req = http.request(CONFIG.remoteOsmUrl, { method: 'HEAD' }, (res) => {
        const remoteMtime = new Date(res.headers['last-modified']);

        if (remoteMtime > stat.mtime) {
          // Remote file more recent -> download.
          download().then(resolve);
        } else {
          // File exists and up to date -> nothing to do.
          resolve();
        }
      });

      req.end();
    } catch (err) {
      if (err.code !== 'ENOENT') {
        reject(err);
        return;
      }

      // File does not exists -> download.
      download().then(resolve);
    }
  });
}

module.exports = downloadOsmFile;

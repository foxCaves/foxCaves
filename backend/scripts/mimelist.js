'use strict';

const { get } = require('https');
const { writeFileSync } = require('fs');
const { join } = require('path');

const outfile = join(__dirname, '../modules/foxcaves/mimetypes.lua');

const URL = 'https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json';

function parseMimes(mimes) {
    let extensionToMimeMap = {};

    for (const mime of Object.keys(mimes)) {
        const { extensions } = mimes[mime];
        if (!extensions) {
            continue;
        }
        for (const ext of extensions) {
            extensionToMimeMap[ext] = mime;            
        }
    }

    writeFileSync(outfile, 'return {\n' +
        Object.entries(extensionToMimeMap).map(([key, value]) => `\t[${JSON.stringify(key)}] = ${JSON.stringify(value)}`).join(',\n') +
    '\n}\n');
}

get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        const mimes = JSON.parse(data);
        parseMimes(mimes);
    });
});

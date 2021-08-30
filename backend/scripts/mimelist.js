'use strict';

const { get } = require('https');
const { writeFileSync } = require('fs');

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

    writeFileSync('../modules/foxcaves/mimetypes.lua', 'return {\n' +
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

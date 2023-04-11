'use strict';

const { get } = require('https');
const { writeFileSync } = require('fs');
const { join } = require('path');

const outfile = join(__dirname, '../modules/foxcaves/mimetypes.lua');

const URL = 'https://cdn.jsdelivr.net/gh/jshttp/mime-db@master/db.json';

const SIMPLE_KEY_REGEX = /^[a-z_][a-z0-9_]*$/;
const LUA_KEYWORDS = new Set(['for', 'if', 'in', 'while']);

function luaKeyEncode(key) {
    key = key.toLowerCase();

    if (SIMPLE_KEY_REGEX.test(key) && !LUA_KEYWORDS.has(key)) {
        return key;
    }

    return `['${key}']`;
}

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

    writeFileSync(
        outfile,
        'return {\n' +
            Object.entries(extensionToMimeMap).sort((a, b) => a[0].localeCompare(b[0]))
                .map(([key, value]) => `    ${luaKeyEncode(key)} = '${value}',`)
                .join('\n') +
            '\n}\n',
    );
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

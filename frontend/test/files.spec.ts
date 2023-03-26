import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Page } from '@playwright/test';
import { test } from './fixtures';

// eslint-disable-next-line unicorn/prefer-module
const PWD = __dirname;

async function uploadFile(file: string, page: Page) {
    const filename = `${randomUUID()}${extname(file)}`;
    const buffer = await readFile(join(PWD, file));

    page.on('filechooser', (fileChooser) => {
        fileChooser
            .setFiles({
                buffer,
                name: filename,
                mimeType: 'application/octet-stream',
            })
            // eslint-disable-next-line no-console
            .catch(console.error);
    });

    await page.locator('.file-drop-zone').click();
    await page.locator('.Toastify__toast--success').waitFor();
    await page.locator(`text="${filename}"`).waitFor();
    return filename;
}

function fileLocator(filename: string, page: Page) {
    return page.locator('div.file-card', { has: page.locator(`text="${filename}"`) });
}

test('Upload image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);
    const file = fileLocator(filename, page);

    const src = await file.locator('.card-img-top').getAttribute('src');
    assert(src?.includes('http://short.foxcaves:8080'));
});

test('Upload non-image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.txt', page);
    const file = fileLocator(filename, page);

    const src = await file.locator('.card-img-top').getAttribute('src');
    assert(!src?.includes('http://short.foxcaves:8080'));
});

test('Delete file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);
    const file = fileLocator(filename, page);
    await file.locator('.dropdown-toggle').click();
    await file.locator('.dropdown-item').getByText('Delete').click();

    await page.locator('.btn-primary').getByText('Yes').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.locator(`text="${filename}"`).waitFor({
        state: 'detached',
    });
});

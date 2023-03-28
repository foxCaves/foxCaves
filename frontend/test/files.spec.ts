import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Page } from '@playwright/test';
import axios from 'axios';
import sizeOf from 'image-size';
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
    await fileLocator(filename, page).waitFor();
    return filename;
}

async function viewAndCheckFile(filename: string, src: string, page: Page): Promise<void> {
    const file = fileLocator(filename, page);
    await file.locator('.dropdown-toggle').click();
    await file.locator('.dropdown-item').getByText('View').click();
    await checkFile(src, page);
}

async function checkFile(src: string, page: Page): Promise<void> {
    const href = (await page.locator('p', { hasText: 'Direct link' }).locator('a').getAttribute('href'))!;
    assert(href.includes('http://short.foxcaves:8080'));

    const fileRequest = await axios(href, {
        responseType: 'arraybuffer',
        validateStatus: () => true,
    });

    if (!src) {
        assert(fileRequest.status === 404);
        return;
    }

    assert(fileRequest.status === 200);

    const fileData = (await fileRequest.data) as ArrayBuffer;
    const buffer = await readFile(join(PWD, src));
    assert(Buffer.from(fileData).equals(buffer));
}

function fileLocator(filename: string, page: Page) {
    return page.locator('div.file-card', { has: page.locator(`text="${filename}"`) });
}

test('Files page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    await page.waitForSelector('text="Refresh"');
});

test('Upload image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);
    const file = fileLocator(filename, page);

    // Verify thumbnail exists and is a valid image
    const src = (await file.locator('.card-img-top').getAttribute('src'))!;
    assert(src.includes('http://short.foxcaves:8080'));

    const thumbnail = await axios(src, {
        responseType: 'arraybuffer',
        validateStatus: (status: number) => status === 200,
    });

    assert(thumbnail.status === 200);

    const thumbnailData = (await thumbnail.data) as ArrayBuffer;
    const thumbnailSize = sizeOf(Buffer.from(thumbnailData));
    assert(thumbnailSize.height && thumbnailSize.height > 0);
    assert(thumbnailSize.width && thumbnailSize.width > 0);

    await viewAndCheckFile(filename, 'test.jpg', page);
});

test('Upload non-image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.txt', page);
    const file = fileLocator(filename, page);

    // Verify there is no thumbnail
    const src = (await file.locator('.card-img-top').getAttribute('src'))!;
    assert(!src.includes('http://short.foxcaves:8080'));

    await viewAndCheckFile(filename, 'test.txt', page);
});

test('Delete file', async ({ browser, page }) => {
    const filePage = await browser.newPage({ storageState: await page.context().storageState() });

    await page.goto('http://main.foxcaves:8080/files');
    await filePage.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);

    await viewAndCheckFile(filename, 'test.jpg', filePage);

    const file = fileLocator(filename, page);

    // Verify thumbnail exists and is a valid image
    const thumbnailSrc = (await file.locator('.card-img-top').getAttribute('src'))!;
    assert(thumbnailSrc.includes('http://short.foxcaves:8080'));
    await axios(thumbnailSrc, {
        responseType: 'arraybuffer',
        validateStatus: (status: number) => status === 200,
    });

    await file.locator('.dropdown-toggle').click();
    await file.locator('.dropdown-item').getByText('Delete').click();

    await page.locator('.btn-primary').getByText('Yes').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.locator(`text="${filename}"`).waitFor({
        state: 'detached',
    });

    // Verify thumbnail and file are both gone
    await checkFile('', filePage);

    await axios(thumbnailSrc, {
        responseType: 'arraybuffer',
        validateStatus: (status: number) => status === 404,
    });
});

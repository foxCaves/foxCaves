/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import assert from 'node:assert';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Page } from '@playwright/test';
import axios from 'axios';
import sizeOf from 'image-size';
import { testLoggedIn } from './fixtures';
import { randomID, waitForToast } from './utils';

// eslint-disable-next-line unicorn/prefer-module
const PWD = __dirname;

async function uploadFile(file: string, page: Page) {
    const filename = `${randomID()}${path.extname(file)}`;
    const buffer = await readFile(path.join(PWD, file));

    page.on('filechooser', (fileChooser) => {
        fileChooser
            .setFiles({
                buffer,
                name: filename,
                mimeType: 'application/octet-stream',
            })
            .catch((error: unknown) => {
                // eslint-disable-next-line no-console
                console.error(error);
            });
    });

    await page.locator('.file-drop-zone').click();
    await fileLocator(filename, page).waitFor();
    await waitForToast(page, 'Uploaded file');
    return filename;
}

async function viewAndCheckFile(filename: string, src: string, page: Page): Promise<void> {
    /*
     * Find the file view page and go to it, then check the file
     * Empty src == assume file is supposed to be gone
     */
    const file = fileLocator(filename, page);
    await file.locator('.dropdown-toggle').click();
    await file.locator('.dropdown-item').getByText('View').click();
    await checkFile(src, page);
}

async function checkFile(src: string, page: Page): Promise<void> {
    /*
     * Assume we are on the file view page and check the file
     * Empty src == assume file is supposed to be gone
     */
    const href = await page.locator('p', { hasText: 'Direct link' }).locator('a').getAttribute('href');
    assert.ok(href);
    assert.ok(href.includes('http://cdn.foxcaves:8080'));

    const fileRequest = await axios(href, {
        responseType: 'arraybuffer',
        validateStatus: () => true,
    });

    if (!src) {
        assert.ok(fileRequest.status === 404);
        return;
    }

    assert.ok(fileRequest.status === 200);

    const fileData = (await fileRequest.data) as ArrayBuffer;
    const buffer = await readFile(path.join(PWD, src));
    assert.ok(Buffer.from(fileData).equals(buffer));
}

function fileLocator(filename: string, page: Page) {
    return page.locator('div.file-card', { hasText: filename });
}

testLoggedIn('Files page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    await page.waitForSelector('text="Refresh"');
});

testLoggedIn('Upload image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);
    const file = fileLocator(filename, page);

    // Verify thumbnail exists and is a valid image
    const src = await file.locator('.card-img-top').getAttribute('src');
    assert.ok(src);
    assert.ok(src.includes('http://cdn.foxcaves:8080'));

    const thumbnail = await axios(src, {
        responseType: 'arraybuffer',
        validateStatus: (status: number) => status === 200,
    });

    assert.ok(thumbnail.status === 200);

    const thumbnailData = (await thumbnail.data) as ArrayBuffer;
    const thumbnailSize = sizeOf(Buffer.from(thumbnailData));
    assert.ok(thumbnailSize.height && thumbnailSize.height > 0);
    assert.ok(thumbnailSize.width && thumbnailSize.width > 0);

    await viewAndCheckFile(filename, 'test.jpg', page);
});

testLoggedIn('Upload non-image file', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.txt', page);
    const file = fileLocator(filename, page);

    // Verify there is no thumbnail
    const src = await file.locator('.card-img-top').getAttribute('src');
    assert.ok(src);
    assert.ok(!src.includes('http://cdn.foxcaves:8080'));

    await viewAndCheckFile(filename, 'test.txt', page);
});

testLoggedIn('Delete file', async ({ browser, page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    const filename = await uploadFile('test.jpg', page);

    // Second secondary page to the file view
    await viewAndCheckFile(filename, 'test.jpg', page);
    const filePage = await browser.newPage({ storageState: undefined });
    await filePage.goto(page.url());

    await page.goto('http://main.foxcaves:8080/files');
    const file = fileLocator(filename, page);

    // Verify file and thumbnail exist
    const thumbnailSrc = await file.locator('.card-img-top').getAttribute('src');
    assert.ok(thumbnailSrc);
    assert.ok(thumbnailSrc.includes('http://cdn.foxcaves:8080'));
    await axios(thumbnailSrc, {
        responseType: 'arraybuffer',
        validateStatus: (status: number) => status === 200,
    });

    await file.locator('.dropdown-toggle').click();
    await file.locator('.dropdown-item').getByText('Delete').click();

    await page.locator('.btn-primary').getByText('Yes').click();
    await waitForToast(page, 'Deleted file');

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

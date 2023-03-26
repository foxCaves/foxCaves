import { test } from './fixtures';

test('Files page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    await page.waitForSelector('text="Refresh"');
});

test('Links page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/links');
    await page.waitForSelector('text="Refresh"');
});

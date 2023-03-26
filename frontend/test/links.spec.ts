import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { Page } from '@playwright/test';
import { test } from './fixtures';

async function createLink(page: Page) {
    const linkUrl = `http://main.foxcaves:8080?${randomUUID()}`;
    await page.locator('.btn-primary').getByText('Create new link').click();
    await page.locator('input[name="createLink"]').fill(linkUrl);
    await page.locator('.btn-primary').getByText('Shorten').click();
    await page.locator('.Toastify__toast--success').waitFor();
    await linkLocator(linkUrl, page).waitFor();
    return linkUrl;
}

function linkLocator(linkUrl: string, page: Page) {
    return page.locator('tr', { has: page.locator('td', { has: page.locator(`a[href="${linkUrl}"]`) }) });
}

test('Create link', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/links');
    const linkUrl = await createLink(page);
    const link = linkLocator(linkUrl, page);
    const shortUrl = await link.locator('a').nth(0).getAttribute('href');
    assert(shortUrl?.includes('http://short.foxcaves:8080'));

    await page.goto(shortUrl!);
    await page.waitForURL(linkUrl);
});

test('Delete link', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/links');
    const linkUrl = await createLink(page);
    const link = linkLocator(linkUrl, page);
    await link.locator('.btn-danger').getByText('Delete').click();

    await page.locator('.btn-primary').getByText('Yes').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await link.waitFor({
        state: 'detached',
    });
});

import assert from 'node:assert';
import { Page } from '@playwright/test';
import { testLoggedIn } from './fixtures';
import { randomID, waitForToast } from './utils';

async function createLink(page: Page) {
    const linkUrl = `http://app.foxcaves:8080?${randomID()}`;
    await page.locator('.btn-primary').getByText('Create new link', { exact: true }).click();
    await page.locator('input[name="createLink"]').fill(linkUrl);
    await page.locator('.btn-primary').getByText('Create', { exact: true }).click();
    await waitForToast(page, 'Created link');
    await linkLocator(linkUrl, page).waitFor();
    return linkUrl;
}

function linkLocator(linkUrl: string, page: Page) {
    return page.locator('tr', { has: page.locator('td', { has: page.locator(`a[href="${linkUrl}"]`) }) });
}

testLoggedIn('Links page', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/links');
    await page.waitForSelector('text="Refresh"');
});

testLoggedIn('Create link', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/links');
    const linkUrl = await createLink(page);
    const link = linkLocator(linkUrl, page);
    const url = await link.locator('a').nth(0).getAttribute('href');
    assert.ok(url);
    assert.ok(url.includes('http://cdn.foxcaves:8080'));

    await page.goto(url);
    await page.waitForURL(linkUrl);
});

testLoggedIn('Delete link', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/links');
    const linkUrl = await createLink(page);
    const link = linkLocator(linkUrl, page);
    await link.locator('.btn-danger').getByText('Delete', { exact: true }).click();
    await page.locator('.btn-primary').getByText('Yes', { exact: true }).click();
    await waitForToast(page, 'Deleted link');

    await link.waitFor({
        state: 'detached',
    });
});

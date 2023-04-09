import { test } from '@playwright/test';
import { doLoginPage } from './utils';

test('Main page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/');
    await page.locator('text="Welcome, Guest!"').waitFor();
});

test('Login page', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/login');
    await page.waitForSelector('input[name="password"]', {
        timeout: 1000,
    });
});

test('Files page redirect', async ({ page }) => {
    await page.goto('http://main.foxcaves:8080/files');
    await page.waitForURL('http://main.foxcaves:8080/login');
});

test('Register and log in', async ({ browser }) => {
    const page = await browser.newPage({ storageState: undefined });
    await doLoginPage(page);

    await page.close();
});

test('Log out', async ({ browser }) => {
    const page = await browser.newPage({ storageState: undefined });
    await doLoginPage(page);

    await page.goto('http://main.foxcaves:8080/logout');

    await page.locator('.btn-primary').getByText('Yes').click();
    await page.locator('text="Welcome, Guest!"').waitFor();

    await page.goto('http://main.foxcaves:8080');
    await page.locator('text="Welcome, Guest!"').waitFor();

    await page.close();
});

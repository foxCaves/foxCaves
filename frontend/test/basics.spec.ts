import { test } from '@playwright/test';

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

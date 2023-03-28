import { randomUUID } from 'node:crypto';
import { Browser, Page } from '@playwright/test';

export async function doLoginPage(page: Page): Promise<void> {
    const username = `test_user_${randomUUID()}`;
    const password = `test_password_${randomUUID()}`;

    await page.goto('http://main.foxcaves:8080/register');
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="passwordConfirm"]').fill(password);
    await page.locator('input[name="email"]').fill(`${username}@main.foxcaves`);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy').check();
    await page.getByRole('button').locator('text="Register"').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.goto('http://main.foxcaves:8080/login');
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button').locator('text="Login"').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.goto('http://main.foxcaves:8080/login');
    await page.locator('text="Home"').waitFor();
}

export async function makeLoggedInPage(browser: Browser): Promise<Page> {
    const page = await browser.newPage({ storageState: undefined });
    await doLoginPage(page);
    return page;
}

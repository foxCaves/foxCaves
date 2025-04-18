import { randomUUID } from 'node:crypto';
import { Page } from '@playwright/test';

export interface TestUser {
    username: string;
    password: string;
    apiKey: string;
}

export async function waitForToast(page: Page, text: string, toastClass = 'success'): Promise<void> {
    await page.locator(`.Toastify__toast--${toastClass}`, { hasText: text }).waitFor();
}

export async function doLoginPage(page: Page, user?: Omit<TestUser, 'apiKey'>, admin?: boolean): Promise<TestUser> {
    user ??= {
        username: `test_user_${randomUUID()}`,
        password: `test_password_${randomUUID()}`,
    };

    await page.goto('http://app.foxcaves:8080/register');
    await page.locator('input[name="username"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[name="passwordConfirm"]').fill(user.password);
    await page.locator('input[name="email"]').fill(`${user.username}@app.foxcaves`);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy').check();
    await page.getByRole('button').locator('text="Register"').click();
    await waitForToast(page, 'Registration successful');

    await page.goto('http://app.foxcaves:8080/login');
    await page.locator('input[name="username"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button').locator('text="Login"').click();
    await waitForToast(page, 'Logged in');
    await page.locator(`text="Welcome, ${user.username}!"`).waitFor();

    await page.goto('http://app.foxcaves:8080');
    await page.locator(`text="Welcome, ${user.username}!"`).waitFor();

    if (admin) {
        const resp = await page.request.post('http://app.foxcaves:8080/api/v1/system/testing/promote');
        if (!resp.ok()) {
            throw new Error(`Failed to promote user: ${resp.status()} ${await resp.text()}`);
        }
    }

    await page.goto('http://app.foxcaves:8080/account');
    const apiKey = await page.locator('input[name="api_key"]').inputValue();
    return {
        ...user,
        apiKey,
    };
}

export function randomID(): string {
    return randomUUID().slice(0, 8);
}

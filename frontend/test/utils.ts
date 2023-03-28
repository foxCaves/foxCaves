import { randomUUID } from 'node:crypto';
import { Page } from '@playwright/test';

export interface TestUser {
    username: string;
    password: string;
}

export async function doLoginPage(page: Page, user?: TestUser): Promise<TestUser> {
    if (!user) {
        user = {
            username: `test_user_${randomUUID()}`,
            password: `test_password_${randomUUID()}`,
        };
    }

    await page.goto('http://main.foxcaves:8080/register');
    await page.locator('input[name="username"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[name="passwordConfirm"]').fill(user.password);
    await page.locator('input[name="email"]').fill(`${user.username}@main.foxcaves`);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy').check();
    await page.getByRole('button').locator('text="Register"').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.goto('http://main.foxcaves:8080/login');
    await page.locator('input[name="username"]').fill(user.username);
    await page.locator('input[name="password"]').fill(user.password);
    await page.getByLabel('Remember me').check();
    await page.getByRole('button').locator('text="Login"').click();
    await page.locator('.Toastify__toast--success').waitFor();

    await page.goto('http://main.foxcaves:8080/login');
    await page.locator('text="Home"').waitFor();

    return user;
}

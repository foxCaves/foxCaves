import { randomUUID } from 'node:crypto';
import { test } from '@playwright/test';

test('Registration page', async ({ page }) => {
    const username = `special_test_user_${randomUUID()}`;
    const password = 'special_test_password';

    await page.goto('http://main.foxcaves:8080/register');
    await page.locator('input[name="username"]').fill(username);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="passwordConfirm"]').fill(password);
    await page.locator('input[name="email"]').fill(`${username}@main.foxcaves`);
    await page.getByLabel('I agree to the Terms of Service and Privacy Policy').check();
    await page.getByRole('button').locator('text="Register"').click();
    await page.locator('.Toastify__toast--success').waitFor();
});

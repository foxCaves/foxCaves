import fs from 'node:fs';
import path from 'node:path';
import { test as baseTest } from '@playwright/test';

export const test = baseTest.extend<object, { workerStorageState: string }>({
    // Use the same storage state for all tests in this worker.
    storageState: async ({ workerStorageState }, use) => {
        await use(workerStorageState);
    },

    // Authenticate once per worker with a worker-scoped fixture.
    workerStorageState: [
        async ({ browser }, use) => {
            // Use parallelIndex as a unique identifier for each worker.
            const id = test.info().parallelIndex;
            const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

            if (fs.existsSync(fileName)) {
                // Reuse existing authentication state if any.
                await use(fileName);
                return;
            }

            // Important: make sure we authenticate in a clean environment by unsetting storage state.
            const page = await browser.newPage({ storageState: undefined });

            const username = `test_user_${id}`;
            const password = `test_password_${id}`;

            try {
                await page.goto('http://main.foxcaves:8080/register');
                await page.locator('input[name="username"]').fill(username);
                await page.locator('input[name="password"]').fill(password);
                await page.locator('input[name="passwordConfirm"]').fill(password);
                await page.locator('input[name="email"]').fill(`${username}@main.foxcaves`);
                await page.getByLabel('I agree to the Terms of Service and Privacy Policy').check();
                await page.getByRole('button').locator('text="Register"').click();
                await page.getByRole('alert').waitFor();
                // TODO: Check for success message
            } catch {
                // The user might already exist, that's fine.
            }

            await page.goto('http://main.foxcaves:8080/login');
            await page.locator('input[name="username"]').fill(username);
            await page.locator('input[name="password"]').fill(password);
            await page.getByLabel('Remember me').check();
            await page.getByRole('button').locator('text="Login"').click();
            await page.getByRole('alert').waitFor();
            // TODO: Check for success message

            await page.goto('http://main.foxcaves:8080/login');
            await page.locator('text="Home"').waitFor();
            // End of authentication steps.

            await page.context().storageState({ path: fileName });
            await page.close();
            await use(fileName);
        },
        { scope: 'worker' },
    ],
});

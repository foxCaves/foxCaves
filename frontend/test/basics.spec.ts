import { testGuest } from './fixtures';
import { doLoginPage } from './utils';

testGuest('Main page', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/');
    await page.locator('text="Welcome, Guest!"').waitFor();
});

testGuest('Git revision on main page', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/');

    const gitRevision = process.env.GIT_REVISION ?? 'UNKNOWN';
    if (gitRevision === 'UNKNOWN') {
        if (process.env.CI) {
            throw new Error('GIT_REVISION is not set in CI');
        }
        // eslint-disable-next-line no-console
        console.warn('GIT_REVISION is not set, skipping test');
        return;
    }

    await page.getByText(`Frontend revision: ${gitRevision}`).waitFor();
    await page.getByText(`Backend revision: ${gitRevision}`).waitFor();
});

testGuest('Login page', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/login');
    await page.waitForSelector('input[name="password"]', {
        timeout: 1000,
    });
});

testGuest('Files page redirect', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/files');
    await page.waitForURL('http://app.foxcaves:8080/login');
});

testGuest('Register and log in', async ({ page }) => {
    await doLoginPage(page);
});

testGuest('Log out', async ({ page }) => {
    await doLoginPage(page);

    await page.goto('http://app.foxcaves:8080/logout');

    await page.locator('.btn-primary').getByText('Yes', { exact: true }).click();
    await page.locator('text="Welcome, Guest!"').waitFor();

    await page.goto('http://app.foxcaves:8080');
    await page.locator('text="Welcome, Guest!"').waitFor();
});

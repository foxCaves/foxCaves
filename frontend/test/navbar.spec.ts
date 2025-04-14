import { testGuest, testLoggedIn } from './fixtures';

testGuest('Navbar as guest', async ({ page }) => {
    await page.goto('http://app.foxcaves:8080/');
    await page.locator('text="Welcome, Guest!"').waitFor();

    await page.locator('.nav-link', { hasText: 'Login' }).waitFor();

    await page.locator('.nav-link', { hasText: 'Register' }).waitFor();

    await page.locator('.nav-link', { hasText: 'Files' }).waitFor({
        state: 'hidden',
    });

    await page.locator('.nav-link', { hasText: 'Links' }).waitFor({
        state: 'hidden',
    });
});

testLoggedIn('Navbar logged-in', async ({ page, testUser }) => {
    await page.goto('http://app.foxcaves:8080/');
    await page.locator(`text="Welcome, ${testUser.username}!"`).waitFor();

    await page.locator('.nav-link', { hasText: 'Login' }).waitFor({
        state: 'hidden',
    });

    await page.locator('.nav-link', { hasText: 'Register' }).waitFor({
        state: 'hidden',
    });

    await page.locator('.nav-link', { hasText: 'Files' }).waitFor();

    await page.locator('.nav-link', { hasText: 'Links' }).waitFor();
});

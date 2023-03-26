import { defineConfig, devices } from '@playwright/test';

// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default defineConfig({
    testDir: 'test',
    // Run all tests in parallel.
    fullyParallel: true,
    // Fail the build on CI if you accidentally left test.only in the source code.
    forbidOnly: !!process.env.CI,
    // Retry on CI only.
    retries: 0,
    // Reporter to use
    reporter: process.env.CI ? 'github' : 'list',
    timeout: 5000,
    use: {
        // Base URL to use in actions like `await page.goto('/')`.
        baseURL: 'http://main.foxcaves:8080',
        // Collect trace when retrying the failed test.
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    // Configure projects for major browsers.
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Run your local dev server before starting the tests.
    webServer: {
        command: 'cd .. && docker-compose up --build',
        url: 'http://main.foxcaves:8080',
        reuseExistingServer: true,
    },
});

import { test } from '@playwright/test';
import { doLoginPage } from './utils';

test('Register and log in', async ({ page }) => {
    await page.context().storageState(undefined);
    await doLoginPage(page);
});

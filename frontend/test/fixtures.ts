/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test as baseTest } from '@playwright/test';
import { doLoginPage, TestUser } from './utils';

async function getStoragePath(suffix: 'storage' | 'user'): Promise<string> {
    const basePath = path.resolve(testLoggedIn.info().project.outputDir, '.auth');
    try {
        await mkdir(basePath, { recursive: true });
    } catch {
        // Ignore errors.
    }

    // Use parallelIndex as a unique identifier for each worker.
    const id = testLoggedIn.info().parallelIndex;
    return path.resolve(basePath, `${id}_${suffix}.json`);
}

export const testGuest = baseTest.extend<object, object>({
    // eslint-disable-next-line no-empty-pattern
    storageState: async ({}, setStorageState) => {
        await setStorageState(undefined);
    },
});

export const testLoggedIn = baseTest.extend<{ readonly testUser: TestUser }, { workerStorageState: string }>({
    // Use the same storage state for all tests in this worker.
    storageState: async ({ workerStorageState }, setStorageState) => {
        await setStorageState(workerStorageState);
    },

    // eslint-disable-next-line no-empty-pattern
    testUser: async ({}, setStorageState) => {
        await setStorageState(JSON.parse(await readFile(await getStoragePath('user'), 'utf8')) as TestUser);
    },

    // Authenticate once per worker with a worker-scoped fixture.
    workerStorageState: [
        async ({ browser }, setStorageState) => {
            const fileName = await getStoragePath('storage');

            if (existsSync(fileName)) {
                // Reuse existing authentication state if any.
                await setStorageState(fileName);
                return;
            }

            // Important: make sure we authenticate in a clean environment by unsetting storage state.
            const page = await browser.newPage({ storageState: undefined });
            const user = await doLoginPage(page);

            await writeFile(await getStoragePath('user'), JSON.stringify(user), 'utf8');

            await page.context().storageState({ path: fileName });
            await page.close();
            await setStorageState(fileName);
        },
        { scope: 'worker' },
    ],
});

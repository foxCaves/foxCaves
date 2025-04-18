import assert from 'node:assert';
import { Locator, Page } from '@playwright/test';
import { testLoggedIn } from './fixtures';
import { apiReqData, doLoginPage, TestUser } from './utils';

interface NewsItem {
    id: string;
    title: string;
    content: string;
}

async function createNews(page: Page, user: TestUser, news: Omit<NewsItem, 'id'>): Promise<NewsItem> {
    news.title = `test_news_${news.title}`;

    const resp = await page.request.post('http://app.foxcaves:8080/api/v1/news', apiReqData(user, news));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const respNews = (await resp.json()) as NewsItem;
    assert.ok(respNews.id);
    return respNews;
}

async function waitForNews(page: Page, news: NewsItem): Promise<Locator> {
    await page.goto('http://app.foxcaves:8080');
    const locator = page.locator(`text="${news.title}"`);
    await locator.waitFor({
        state: 'attached',
    });
    await page.waitForSelector(`text="${news.content}"`);
    return locator;
}

testLoggedIn('Home page', async ({ browser, page }) => {
    const adminPage = await browser.newPage({ storageState: undefined });
    const adminUser = await doLoginPage(adminPage, undefined, true);
    const news = await createNews(adminPage, adminUser, {
        title: 'initial',
        content: 'Initial news to ensure loading is done',
    });
    await adminPage.close();

    await waitForNews(page, news);
});

testLoggedIn('Delete link', async ({ browser, page }) => {
    const adminPage = await browser.newPage({ storageState: undefined });
    const adminUser = await doLoginPage(adminPage, undefined, true);
    const news = await createNews(adminPage, adminUser, {
        title: 'deletion',
        content: 'Make sure news deletion works',
    });

    const newsLocator = await waitForNews(page, news);

    const resp = await adminPage.request.delete(
        `http://app.foxcaves:8080/api/v1/news/${news.id}`,
        apiReqData(adminUser),
    );
    assert.ok(resp.ok());

    await adminPage.close();

    await newsLocator.waitFor({
        state: 'detached',
    });
});

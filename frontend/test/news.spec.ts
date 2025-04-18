import assert from 'node:assert';
import { Locator, Page } from '@playwright/test';
import { testLoggedIn } from './fixtures';

interface NewsItem {
    id: string;
    title: string;
    content: string;
}

async function createNews(page: Page, news: Omit<NewsItem, 'id'>): Promise<NewsItem> {
    if (!news.title.startsWith('test_news_')) {
        news.title = `test_news_${news.title}`;
    }

    const resp = await page.request.post('http://app.foxcaves:8080/api/v1/news', {
        data: news,
    });
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

testLoggedIn('Home page', async ({ page }) => {
    const news = await createNews(page, {
        title: 'initial',
        content: 'Initial news to ensure loading is done',
    });

    await waitForNews(page, news);
});

testLoggedIn('Delete link', async ({ page }) => {
    const news = await createNews(page, {
        title: 'deletion',
        content: 'Make sure news deletion works',
    });

    const newsLocator = await waitForNews(page, news);

    const resp = await page.request.delete(`http://app.foxcaves:8080/api/v1/news/{news.id}`);
    assert.ok(resp.ok());

    await newsLocator.waitFor({
        state: 'detached',
    });
});

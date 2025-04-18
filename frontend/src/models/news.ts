import { APIAccessor, HttpError, ListResponse } from '../utils/api';
import { BaseModel } from './base';

export class NewsModel extends BaseModel {
    public id = '';
    public title = '';
    public content = '';

    public static async getById(id: string, apiAccessor: APIAccessor): Promise<NewsModel | undefined> {
        try {
            const api = await apiAccessor.fetch(`/api/v1/news/${encodeURIComponent(id)}`);
            return NewsModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static async getAll(apiAccessor: APIAccessor): Promise<NewsModel[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const res = (await apiAccessor.fetch(`/api/v1/news`)) as ListResponse;
        return res.items.map((link) => NewsModel.wrapNew(link));
    }

    public static wrapNew(obj: unknown): NewsModel {
        return new NewsModel().wrap(obj);
    }
}

import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
import { BaseModel } from './base';
import { UserModel } from './user';

export class LinkModel extends BaseModel {
    public id = '';
    public url = '';
    public short_url = '';
    public owner = '';

    public static async getById(id: string): Promise<LinkModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/links/${encodeURIComponent(id)}`);
            return LinkModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static async getByUser(user: UserModel): Promise<LinkModel[]> {
        const res = (await fetchAPI(`/api/v1/users/${encodeURIComponent(user.id)}/links`)) as unknown[];
        return res.map((link) => LinkModel.wrapNew(link));
    }

    public static async create(url: string): Promise<LinkModel> {
        const api = await fetchAPI('/api/v1/links', {
            method: 'POST',
            data: { url },
        });

        return LinkModel.wrapNew(api);
    }

    public static wrapNew(obj: unknown): LinkModel {
        return new LinkModel().wrap(obj);
    }

    public async delete(): Promise<void> {
        await fetchAPIRaw(`/api/v1/links/${encodeURIComponent(this.id)}`, {
            method: 'DELETE',
        });
    }
}

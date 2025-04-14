import { APIAccessor, HttpError, ListResponse } from '../utils/api';
import { BaseModel } from './base';
import { UserModel } from './user';

export class LinkModel extends BaseModel {
    public id = '';
    public url = '';
    public target = '';
    public owner = '';

    public static async getById(id: string, apiAccessor: APIAccessor): Promise<LinkModel | undefined> {
        try {
            const api = await apiAccessor.fetch(`/api/v1/links/${encodeURIComponent(id)}`);
            return LinkModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static async getByUser(user: UserModel, apiAccessor: APIAccessor): Promise<LinkModel[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const res = (await apiAccessor.fetch(`/api/v1/users/${encodeURIComponent(user.id)}/links`)) as ListResponse;
        return res.items.map((link) => LinkModel.wrapNew(link));
    }

    public static async create(url: string, apiAccessor: APIAccessor): Promise<LinkModel> {
        const api = await apiAccessor.fetch('/api/v1/links', {
            method: 'POST',
            data: { url },
        });

        return LinkModel.wrapNew(api);
    }

    public static wrapNew(obj: unknown): LinkModel {
        return new LinkModel().wrap(obj);
    }

    public async delete(apiAccessor: APIAccessor): Promise<void> {
        await apiAccessor.fetch(`/api/v1/links/${encodeURIComponent(this.id)}`, {
            method: 'DELETE',
        });
    }
}

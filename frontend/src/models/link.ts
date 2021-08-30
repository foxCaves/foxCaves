import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
import { BaseModel } from './base';
import { UserModel } from './user';

export class LinkModel extends BaseModel {
    public id: string = '';
    public url: string = '';
    public short_url: string = '';
    public user: string = '';

    static async getById(id: string): Promise<LinkModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/links/${id}`);
            return LinkModel.wrapNew(api);
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }

    static async getByUser(user: UserModel): Promise<LinkModel[]> {
        const res = await fetchAPI(`/api/v1/users/${user.id}/links`);
        return res.map(LinkModel.wrapNew);
    }

    static async create(url: string) {
        const api = await fetchAPI('/api/v1/links', {
            method: 'POST',
            body: { url },
        });
        return LinkModel.wrapNew(api);
    }

    async delete() {
        await fetchAPIRaw(`/api/v1/links/${this.id}`, {
            method: 'DELETE',
        });
    }

    static wrapNew(obj: unknown) {
        return new LinkModel().wrap(obj);
    }
}

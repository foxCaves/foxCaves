import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
import { DatedModel } from './base';

export class LinkModel extends DatedModel {
    public id: string = '';
    public url: string = '';
    public short_url: string = '';
    public user: string = '';

    static async getById(id: string): Promise<LinkModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/links/${id}`);
            let m = new LinkModel();
            m = Object.assign(m, api);
            m.convertDates();
            return m;
        } catch (e) {
            if (
                e instanceof HttpError &&
                (e.status === 404 || e.status === 403)
            ) {
                return undefined;
            }
            throw e;
        }
    }

    static async getAll() {
        const res = await fetchAPI('/api/v1/links');
        return res.map((api: any) => {
            let m = new LinkModel();
            m = Object.assign(m, api);
            m.convertDates();
            return m;
        });
    }

    static async create(url: string) {
        const api = await fetchAPI('/api/v1/links', {
            method: 'POST',
            body: JSON.stringify({ url }),
        });
        let m = new LinkModel();
        m = Object.assign(m, api);
        m.convertDates();
        return m;
    }

    async delete() {
        await fetchAPIRaw(`/api/v1/links/${this.id}`, {
            method: 'DELETE',
        });
    }
}

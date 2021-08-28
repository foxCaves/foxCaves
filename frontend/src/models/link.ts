import { fetchAPI, HttpError } from '../utils/api';
import { formatSize } from '../utils/formatting';
import { DatedModel } from './base';

export class LinkModel extends DatedModel {
    public id: string = '';
    public url: string = '';
    public short_url: string = '';
    public user: string = '';

    static async getById(
        id: string,
    ): Promise<LinkModel | undefined> {
        let url = `/api/v1/links/${id}`;
        try {
            const api = await fetchAPI(url);
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
}

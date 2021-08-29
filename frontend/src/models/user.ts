import { fetchAPI, HttpError } from '../utils/api';
import { DatedModel } from './base';

export class UserModel extends DatedModel {
    public id: string = '';
    public username: string = '';

    static async getById(id: string): Promise<UserModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${id}`);
            let m = new UserModel();
            m = Object.assign(m, api);
            m.convertDates();
            return m;
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }
}

export class UserDetailsModel extends UserModel {
    public email: string = '';
    public apikey: string = '';
    public storage_quota: number = 0;
    public storage_used: number = 0;

    static async getById(id: string): Promise<UserDetailsModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${id}/details`);
            let m = new UserDetailsModel();
            m = Object.assign(m, api);
            m.convertDates();
            return m;
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }
}

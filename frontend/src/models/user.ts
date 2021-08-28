import { fetchAPI, HttpError } from '../utils/api';
import { DatedModel } from './base';

export class UserModel extends DatedModel {
    public id: string = '';
    public username: string = '';
    public email?: string;
    public apikey?: string;

    static async getById(
        id: string,
        withDetails: boolean,
    ): Promise<UserModel | undefined> {
        let url = `/api/v1/users/${id}`;
        if (withDetails) {
            url += '/details';
        }
        try {
            const api = await fetchAPI(url);
            let m = new UserModel();
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
}

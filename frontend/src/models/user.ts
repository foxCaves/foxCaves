import { fetchAPI, HttpError } from '../utils/api';

export class User {
    public id: string;
    public username: string;
    public email?: string;
    public apikey?: string;

    constructor(id: string, username: string) {
        this.id = id;
        this.username = username;
    }

    static async getById(
        id: string,
        withDetails: boolean,
    ): Promise<User | undefined> {
        let url = `/api/v1/users/${id}`;
        if (withDetails) {
            url += '/details';
        }
        try {
            const user = await fetchAPI(url);
            return user as User;
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

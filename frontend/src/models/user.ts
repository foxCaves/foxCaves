import { fetchAPI, HttpError } from '../utils/api';
import { BaseModel } from './base';

export class UserModel extends BaseModel {
    public id: string = '';
    public username: string = '';

    static async getById(id: string): Promise<UserModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${id}`);
            return UserModel.wrapNew(api);
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }

    static wrapNew(obj: unknown) {
        return new UserModel().wrap(obj);
    }
}

export class UserDetailsModel extends UserModel {
    public email: string = '';
    public apikey: string = '';
    public storage_quota: number = 0;
    public storage_used: number = 0;
    public active: number = 0;

    isActive() {
        return this.active > 0;
    }

    static async getById(id: string): Promise<UserDetailsModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${id}/details`);
            return UserDetailsModel.wrapNew(api);
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }

    static wrapNew(obj: unknown) {
        return new UserDetailsModel().wrap(obj);
    }
}

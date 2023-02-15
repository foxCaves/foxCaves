import { fetchAPI, HttpError } from '../utils/api';
import { BaseModel } from './base';

export class UserModel extends BaseModel {
    public id = '';
    public username = '';

    public static async getById(id: string): Promise<UserModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${encodeURIComponent(id)}`);
            return UserModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    protected static wrapNew(obj: unknown): UserModel {
        return new UserModel().wrap(obj);
    }
}

export class UserDetailsModel extends UserModel {
    public email = '';
    public apikey = '';
    public storage_quota = 0;
    public storage_used = 0;
    public active = 0;

    public static async getById(id: string): Promise<UserDetailsModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/users/${encodeURIComponent(id)}/details`);
            return UserDetailsModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    private static wrapNew(obj: unknown): UserDetailsModel {
        return new UserDetailsModel().wrap(obj);
    }

    public isActive(): boolean {
        return this.active > 0;
    }
}

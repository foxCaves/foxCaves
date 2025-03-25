import { APIAccessor, HttpError } from '../utils/api';
import { BaseModel } from './base';

export class UserModel extends BaseModel {
    public id = '';
    public username = '';

    public static async getById(id: string, apiAccessor: APIAccessor): Promise<UserModel | undefined> {
        try {
            const api = await apiAccessor.fetch(`/api/v1/users/${encodeURIComponent(id)}`);
            return UserModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static wrapNew(obj: unknown): UserModel {
        return new UserModel().wrap(obj);
    }
}

export class UserDetailsModel extends UserModel {
    public email = '';
    public api_key = '';
    public storage_quota = 0;
    public storage_used = 0;
    public active = 0;
    public email_valid = 0;
    public approved = 0;
    public totp_enabled = 0;

    public static async getById(id: string, apiAccessor: APIAccessor): Promise<UserDetailsModel | undefined> {
        try {
            const api = await apiAccessor.fetch(`/api/v1/users/${encodeURIComponent(id)}/details`);
            return UserDetailsModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static wrapNew(obj: unknown): UserDetailsModel {
        return new UserDetailsModel().wrap(obj);
    }

    public isActive(): boolean {
        return this.active > 0;
    }

    public isApproved(): boolean {
        return this.approved > 0;
    }

    public isValidEmail(): boolean {
        return this.email_valid > 0;
    }

    public isTOTPEnabled(): boolean {
        return this.totp_enabled > 0;
    }
}

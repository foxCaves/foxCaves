import { APIAccessor, HttpError, ListResponse } from '../utils/api';
import { formatSize } from '../utils/formatting';
import { BaseModel } from './base';
import { UserModel } from './user';

export class FileModel extends BaseModel {
    public id = '';
    public name = '';
    public size = 0;
    public owner = '';
    public mimetype = '';

    public thumbnail_url?: string;

    public download_url = '';
    public direct_url = '';
    public view_url = '';

    public static async getById(id: string, apiAccessor: APIAccessor): Promise<FileModel | undefined> {
        try {
            const api = await apiAccessor.fetch(`/api/v1/files/${encodeURIComponent(id)}`);
            return FileModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static async getByUser(user: UserModel, apiAccessor: APIAccessor): Promise<FileModel[]> {
        const res = (await apiAccessor.fetch(`/api/v1/users/${encodeURIComponent(user.id)}/files`)) as ListResponse;
        return res.items.map((i) => FileModel.wrapNew(i));
    }

    public static wrapNew(obj: unknown): FileModel {
        return new FileModel().wrap(obj);
    }

    public async delete(apiAccessor: APIAccessor): Promise<void> {
        await apiAccessor.fetch(`/api/v1/files/${encodeURIComponent(this.id)}`, {
            method: 'DELETE',
        });
    }

    public async rename(name: string, apiAccessor: APIAccessor): Promise<void> {
        await apiAccessor.fetch(`/api/v1/files/${encodeURIComponent(this.id)}`, {
            method: 'PATCH',
            data: { name },
        });

        this.name = name;
    }

    public getFormattedSize(): string {
        return formatSize(this.size);
    }
}

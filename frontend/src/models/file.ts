import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
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

    public static async getById(id: string): Promise<FileModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/files/${encodeURIComponent(id)}`);
            return FileModel.wrapNew(api);
        } catch (error) {
            if (error instanceof HttpError && (error.status === 404 || error.status === 403)) {
                return undefined;
            }

            throw error;
        }
    }

    public static async getByUser(user: UserModel): Promise<FileModel[]> {
        const res = await fetchAPI(`/api/v1/users/${encodeURIComponent(user.id)}/files`);
        return res.map(FileModel.wrapNew);
    }

    private static wrapNew(obj: unknown) {
        return new FileModel().wrap(obj);
    }

    public async delete(): Promise<void> {
        await fetchAPIRaw(`/api/v1/files/${encodeURIComponent(this.id)}`, {
            method: 'DELETE',
        });
    }

    public async rename(name: string): Promise<void> {
        await fetchAPIRaw(`/api/v1/files/${encodeURIComponent(this.id)}`, {
            method: 'PATCH',
            data: { name },
        });

        this.name = name;
    }

    public getFormattedSize(): string {
        return formatSize(this.size);
    }
}

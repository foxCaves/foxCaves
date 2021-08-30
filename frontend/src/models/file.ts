import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
import { formatSize } from '../utils/formatting';
import { BaseModel } from './base';

export enum FileModelType {
    Other = 0,
    Image = 1,
    Text = 2,
    Video = 3,
    Audio = 4,
    Iframe = 5,
    Unknown = -1,
}

export class FileModel extends BaseModel {
    public id: string = '';
    public name: string = '';
    public extension: string = '';
    public size: number = 0;
    public user: string = '';
    public type: FileModelType = FileModelType.Unknown;
    public mimetype: string = '';

    public thumbnail_url?: string;
    public thumbnail_extension: string = '';

    public download_url: string = '';
    public direct_url: string = '';
    public view_url: string = '';

    static async getById(id: string): Promise<FileModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/files/${id}`);
            return FileModel.wrapNew(api);
        } catch (e) {
            if (e instanceof HttpError && (e.status === 404 || e.status === 403)) {
                return undefined;
            }
            throw e;
        }
    }

    static async getAll(): Promise<FileModel[]> {
        const res = await fetchAPI('/api/v1/files');
        return res.map(FileModel.wrapNew);
    }

    async delete() {
        await fetchAPIRaw(`/api/v1/files/${this.id}`, {
            method: 'DELETE',
        });
    }

    async rename(name: string) {
        await fetchAPIRaw(`/api/v1/files/${this.id}`, {
            method: 'PATCH',
            body: { name },
        });
        this.name = name;
    }

    static async upload(file: File) {
        const api = await fetchAPI(`/api/v1/files?name=${encodeURIComponent(file.name)}`, {
            method: 'POST',
            rawBody: file,
        });
        return FileModel.wrapNew(api);
    }

    static wrapNew(obj: unknown) {
        return new FileModel().wrap(obj);
    }

    getFormattedSize() {
        return formatSize(this.size);
    }
}

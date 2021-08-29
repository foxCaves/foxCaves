import { fetchAPI, fetchAPIRaw, HttpError } from '../utils/api';
import { formatSize } from '../utils/formatting';
import { DatedModel } from './base';

enum FileType {
    OTHER = 0,
    IMAGE = 1,
    TEXT = 2,
    VIDEO = 3,
    AUDIO = 4,
    IFRAME = 5,
    UNKNOWN = -1,
}

export class FileModel extends DatedModel {
    public id: string = '';
    public name: string = '';
    public extension: string = '';
    public size: number = 0;
    public user: string = '';
    public type: FileType = FileType.UNKNOWN;
    public mimetype: string = '';

    public thumbnail_url?: string;
    public thumbnail_image: string = '';
    public thumbnail_extension: string = '';

    public download_url: string = '';
    public direct_url: string = '';
    public view_url: string = '';

    static async getById(id: string): Promise<FileModel | undefined> {
        try {
            const api = await fetchAPI(`/api/v1/files/${id}`);
            let m = new FileModel();
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
        const res = await fetchAPI('/api/v1/files');
        return res.map((api: any) => {
            let m = new FileModel();
            m = Object.assign(m, api);
            m.convertDates();
            return m;
        });
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
        const api = await fetchAPI(
            `/api/v1/files?name=${encodeURIComponent(file.name)}`,
            {
                method: 'POST',
                rawBody: file,
            },
        );
        let m = new FileModel();
        m = Object.assign(m, api);
        m.convertDates();
        return m;
    }

    getFormattedSize() {
        return formatSize(this.size);
    }
}

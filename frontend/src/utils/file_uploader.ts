import { toast } from 'react-toastify';
import { FileModel } from '../models/file';
import { APIAccessor, HttpError } from './api';
import { logError } from './misc';

export interface BlobWithName extends Blob {
    name: string;
}
type FileLike = BlobWithName | File;

async function uploadFileInternal(
    file: FileLike,
    apiAccessor: APIAccessor,
    onProgress: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void,
): Promise<FileModel> {
    const csrfToken = await apiAccessor.getCSRFToken();

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/v1/files?name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader('CSRF-Token', csrfToken);

    xhr.upload.addEventListener('progress', onProgress);

    return new Promise<FileModel>((resolve, reject) => {
        xhr.addEventListener('error', () => {
            reject(new HttpError(599, 'Error connecting to server'));
        });

        xhr.addEventListener('load', () => {
            if (xhr.status < 200 || xhr.status > 299) {
                let errorMessage;
                try {
                    const data = JSON.parse(xhr.responseText) as { error: string };
                    errorMessage = data.error;
                } catch (error: unknown) {
                    logError(error as Error);
                }

                reject(new HttpError(xhr.status, errorMessage ?? xhr.responseText));
                return;
            }

            resolve(FileModel.wrapNew(JSON.parse(xhr.responseText)));
        });

        xhr.send(file);
    });
}

export async function uploadFile(file: FileLike, apiAccessor: APIAccessor): Promise<FileModel> {
    const toastId = toast(`Uploading file "${file.name}"...`, {
        autoClose: false,
        progress: 0,
        type: 'info',
        closeButton: false,
        closeOnClick: false,
        draggable: false,
    });

    const progressHandler = (e: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (e.loaded >= e.total) {
            toast.update(toastId, {
                progress: 0.9999,
                render: `File "${file.name}" is being processed by the server...`,
            });

            return;
        }

        toast.update(toastId, {
            progress: e.loaded / e.total,
        });
    };

    try {
        const fileObj = await uploadFileInternal(file, apiAccessor, progressHandler);
        toast(`Uploaded file "${file.name}"!`, {
            type: 'success',
            autoClose: 3000,
        });

        toast.done(toastId);
        return fileObj;
    } catch (error: unknown) {
        toast(`Error uploading file "${file.name}": ${(error as Error).message}`, {
            type: 'error',
            autoClose: 3000,
        });

        toast.done(toastId);
        throw error;
    }
}

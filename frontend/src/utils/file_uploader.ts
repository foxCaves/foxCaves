import { toast } from 'react-toastify';
import { FileModel } from '../models/file';
import { HttpError } from './api';

export interface BlobWithName extends Blob {
    name: string;
}
type FileLike = BlobWithName | File;

async function uploadFileInternal(file: FileLike, onProgress: (e: ProgressEvent<XMLHttpRequestEventTarget>) => void) {
    return new Promise<FileModel>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/v1/files?name=${encodeURIComponent(file.name)}`);
        /*
         * xhr.setRequestHeader('Content-Type', file.type);
         * xhr.setRequestHeader('Content-Length', file.size.toString());
         */

        xhr.upload.addEventListener('progress', onProgress);

        xhr.addEventListener('error', () => {
            reject(new HttpError(599, 'Error connecting to server'));
        });

        xhr.addEventListener('load', () => {
            if (xhr.status < 200 || xhr.status > 299) {
                let errorMessage;
                try {
                    const data = JSON.parse(xhr.responseText);
                    errorMessage = data.error;
                } catch {}

                reject(new HttpError(xhr.status, errorMessage || xhr.responseText));
                return;
            }

            resolve(FileModel.wrapNew(JSON.parse(xhr.responseText)));
        });

        xhr.send(file);
    });
}

export async function uploadFile(file: FileLike): Promise<FileModel> {
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
        const fileObj = await uploadFileInternal(file, progressHandler);
        toast(`File "${file.name}" uploaded!`, {
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

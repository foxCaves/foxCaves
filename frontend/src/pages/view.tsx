import '../resources/view.css';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileModel } from '../models/file';
import { UserModel } from '../models/user';
import { formatDate } from '../utils/formatting';
import { logError } from '../utils/misc';

const TextView: React.FC<{ src: string }> = ({ src }) => {
    const [dataLoading, setDataLoading] = useState(false);
    const [data, setData] = useState<string | undefined>();

    useEffect(() => {
        if (dataLoading || data !== undefined) {
            return;
        }

        setDataLoading(true);
        fetch(src)
            .then(async (response) => response.text())
            .then((newData) => {
                setData(newData);
                setDataLoading(false);
            })
            .catch(logError);
    }, [src, data, dataLoading]);

    return <pre>{data}</pre>;
};

const FileContentView: React.FC<{ file: FileModel }> = ({ file }) => {
    const mimeSplit = file.mimetype.split('/');
    switch (mimeSplit[0]) {
        case 'text':
            return <TextView src={file.direct_url} />;
        case 'image':
            return <img alt={file.name} className="mw-100" src={file.direct_url} />;
        case 'video':
            return <video className="mw-100" controls src={file.direct_url} />;
        case 'audio':
            return <audio controls src={file.direct_url} />;
        case 'application':
            if (mimeSplit[2] === 'pdf') {
                return <iframe className="mw-100 preview-iframe" src={file.direct_url} title="PDF preview" />;
            }

            break;

        default:
        // noop
    }

    return <h3>No preview available</h3>;
};

export const ViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [fileLoading, setFileLoading] = useState(false);
    const [fileLoadDone, setFileLoadDone] = useState(false);
    const [fileError, setFileError] = useState('');
    const [file, setFile] = useState<FileModel | undefined>(undefined);
    const [owner, setOwner] = useState<UserModel | undefined>(undefined);

    const loadFile = useCallback(async () => {
        try {
            const newFile = await FileModel.getById(id!);
            if (newFile) {
                setFile(newFile);
                const newOwner = await UserModel.getById(newFile.owner);
                setOwner(newOwner);
            } else {
                setFileError('File not found');
            }
        } catch (error: unknown) {
            setFileError(error.message);
        }

        setFileLoading(false);
        setFileLoadDone(true);
    }, [id]);

    useEffect(() => {
        if (fileLoading || fileLoadDone) {
            return;
        }

        setFileLoading(true);
        loadFile();
    }, [fileLoading, fileLoadDone, loadFile]);

    if (!fileLoadDone) {
        return (
            <>
                <h1>View file: ID:{id}</h1>
                <br />
                <h3>Loading file information...</h3>
            </>
        );
    }

    if (fileError || !file) {
        return (
            <>
                <h1>View file: ID:{id}</h1>
                <br />
                <h3>Error loading file: {fileError}</h3>
            </>
        );
    }

    return (
        <>
            <h1>View file: {file.name}</h1>
            <br />
            <p>Uploaded by: {owner ? owner.username : 'N/A'}</p>
            <p>Uploaded on: {formatDate(file.created_at)}</p>
            <p>Size: {file.getFormattedSize()}</p>
            <p>
                View link: <a href={file.view_url}>{file.view_url}</a>
            </p>
            <p>
                Direct link: <a href={file.direct_url}>{file.direct_url}</a>
            </p>
            <p>
                Download link: <a href={file.download_url}>{file.download_url}</a>
            </p>
            <FileContentView file={file} />
        </>
    );
};

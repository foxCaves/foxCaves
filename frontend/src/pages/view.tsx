import React, { useState } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileModel } from '../models/file';
import { UserModel } from '../models/user';
import { formatDate } from '../utils/formatting';

import '../resources/view.css';

const TextView: React.FC<{ src: string }> = ({ src }) => {
    const [dataLoading, setDataLoading] = useState(false);
    const [data, setData] = useState<string | undefined>();

    useEffect(() => {
        if (dataLoading || data !== undefined) {
            return;
        }
        setDataLoading(true);
        fetch(src)
            .then((response) => response.text())
            .then((data) => {
                setData(data);
                setDataLoading(false);
            });
    }, [src, data, dataLoading]);

    return <pre>{data}</pre>;
};

const FileContentView: React.FC<{ file: FileModel }> = ({ file }) => {
    const mimeSplit = file.mimetype.split('/');
    switch (mimeSplit[0]) {
        case 'text':
            return <TextView src={file.direct_url} />;
        case 'image':
            return <img src={file.direct_url} alt={file.name} className="mw-100" />;
        case 'video':
            return <video src={file.direct_url} controls className="mw-100" />;
        case 'audio':
            return <audio src={file.direct_url} controls />;
        case 'application':
            if (mimeSplit[2] === 'pdf') {
                return <iframe title="PDF preview" src={file.direct_url} className="mw-100 preview-iframe" />;
            }
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
            const file = await FileModel.getById(id);
            if (!file) {
                setFileError('File not found');
            } else {
                setFile(file);
                const owner = await UserModel.getById(file.owner);
                setOwner(owner);
            }
        } catch (err: any) {
            setFileError(err.message);
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

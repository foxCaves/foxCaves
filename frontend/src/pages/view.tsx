import '../resources/view.css';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { useParams } from 'react-router';
import { FileModel } from '../models/file';
import { UserModel } from '../models/user';
import { AppContext } from '../utils/context';
import { formatDate } from '../utils/formatting';
import { assert, logError } from '../utils/misc';

type ElementCtor = (data?: string) => React.ReactElement;

const newPreElement = (data?: string): React.ReactElement => <pre>{data}</pre>;
const newMarkdownElement = (data?: string): React.ReactElement => <Markdown>{data}</Markdown>;

const TextView: React.FC<{
    readonly src: string;
    readonly ctor: ElementCtor;
}> = ({ src, ctor }) => {
    const [dataLoading, setDataLoading] = useState(false);
    const [data, setData] = useState<string | undefined>();

    useEffect(() => {
        if (dataLoading || data !== undefined) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDataLoading(true);
        fetch(src)
            .then(async (response) => response.text())
            .then((newData) => {
                setData(newData);
                setDataLoading(false);
            })
            .catch(logError);
    }, [src, data, dataLoading]);

    if (dataLoading) {
        return <p>Loading file content for preview...</p>;
    }
    if (data === undefined) {
        return <p>Could not load file content for preview</p>;
    }

    return ctor(data);
};

// eslint-disable-next-line complexity
const FileContentView: React.FC<{ readonly file: FileModel }> = ({ file }) => {
    const extension = file.getExtension();
    switch (extension) {
        case 'c':
        case 'cpp':
        case 'cs':
        case 'ex':
        case 'exs':
        case 'go':
        case 'h':
        case 'hpp':
        case 'htm':
        case 'html':
        case 'java':
        case 'js':
        case 'json':
        case 'lua':
        case 'php':
        case 'py':
        case 'ts':
        case 'txt':
        case 'xml':
        case 'yaml':
        case 'yml':
            return <TextView ctor={newPreElement} src={file.direct_url} />;
        case 'md':
            return <TextView ctor={newMarkdownElement} src={file.direct_url} />;
        case 'bmp':
        case 'gif':
        case 'jpeg':
        case 'jpg':
        case 'png':
        case 'webp':
            return <img alt={file.name} className="mw-100" src={file.direct_url} />;
        case 'mp4':
            return <video className="mw-100" controls src={file.direct_url} />;
        case 'mp3':
        case 'ogg':
            return <audio controls src={file.direct_url} />;
        case 'pdf':
            // eslint-disable-next-line react/iframe-missing-sandbox
            return <iframe className="mw-100 preview-iframe" src={file.direct_url} title="PDF preview" />;
        default:
            return <p>No preview available</p>;
    }
};

export const ViewPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const { id } = useParams<{ id: string }>();
    assert(id);
    const [fileLoading, setFileLoading] = useState(false);
    const [fileLoadDone, setFileLoadDone] = useState(false);
    const [fileError, setFileError] = useState('');
    const [file, setFile] = useState<FileModel | undefined>(undefined);
    const [owner, setOwner] = useState<UserModel | undefined>(undefined);

    const loadFile = useCallback(async () => {
        try {
            const newFile = await FileModel.getById(id, apiAccessor);
            if (newFile) {
                setFile(newFile);
                const newOwner = await UserModel.getById(newFile.owner, apiAccessor);
                setOwner(newOwner);
            } else {
                setFileError('File not found');
            }
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            setFileError((error as Error).message);
        }

        setFileLoading(false);
        setFileLoadDone(true);
    }, [id, apiAccessor]);

    useEffect(() => {
        if (fileLoading || fileLoadDone) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFileLoading(true);
        loadFile().catch(logError);
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
            <h3>File preview</h3>
            <hr />
            <FileContentView file={file} />
        </>
    );
};

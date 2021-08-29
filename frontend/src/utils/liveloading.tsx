import React from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { FileModel } from '../models/file';
import { LinkModel } from '../models/link';

type ModelMap<T> = { [key: string]: T };

interface ModelContext<T> {
    models: ModelMap<T> | undefined;
    set(arr: ModelMap<T>): void;
    refresh(): Promise<void>;
}

export const LinksContext = React.createContext<ModelContext<LinkModel>>({} as ModelContext<LinkModel>);
export const FilesContext = React.createContext<ModelContext<FileModel>>({} as ModelContext<FileModel>);

export const LiveLoadingContainer: React.FC = ({ children }) => {
    const [files, setFiles] = useState<ModelMap<FileModel> | undefined>(undefined);
    const [links, setLinks] = useState<ModelMap<LinkModel> | undefined>(undefined);
    const [wsOpen, setWsOpen] = useState(false);

    const refreshFiles = useCallback(async () => {
        const files = await FileModel.getAll();
        const fileMap: ModelMap<FileModel> = {};
        for (const file of files) {
            fileMap[file.id] = file;
        }
        setFiles(fileMap);
    }, []);

    const refreshLinks = useCallback(async () => {
        const links = await LinkModel.getAll();
        const linkMap: ModelMap<LinkModel> = {};
        for (const link of links) {
            linkMap[link.id] = link;
        }
        setLinks(linkMap);
    }, []);

    useEffect(() => {
        if (wsOpen) {
            return;
        }
        setWsOpen(true);

        const url = new URL(document.location.href);
        url.pathname = '/api/v1/ws/events';
        url.search = '';
        url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
        const ws = new WebSocket(url.href);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log(data);
        };
    }, [wsOpen]);

    return (
        <>
            <LinksContext.Provider value={{ models: links, refresh: refreshLinks, set: setLinks }}>
                <FilesContext.Provider value={{ models: files, refresh: refreshFiles, set: setFiles }}>
                    {children}
                </FilesContext.Provider>
            </LinksContext.Provider>
        </>
    );
};

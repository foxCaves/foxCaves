import React, { useRef } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { FileModel } from '../models/file';
import { LinkModel } from '../models/link';
import { UserDetailsModel } from '../models/user';
import { AppContext } from './context';
import { ReconnectingWebSocket } from './websocket_autoreconnect';

type ModelMap<T> = { [key: string]: T };

interface ModelContext<T> {
    models: ModelMap<T> | undefined;
    set(arr: ModelMap<T>): void;
    refresh(): Promise<void>;
}

interface LiveLoadingPayload {
    action: 'update' | 'create' | 'delete';
    model: 'user' | 'file' | 'link';
    data: unknown;
}

export const LinksContext = React.createContext<ModelContext<LinkModel>>({} as ModelContext<LinkModel>);
export const FilesContext = React.createContext<ModelContext<FileModel>>({} as ModelContext<FileModel>);

export const LiveLoadingContainer: React.FC = ({ children }) => {
    const [files, setFiles] = useState<ModelMap<FileModel> | undefined>(undefined);
    const [links, setLinks] = useState<ModelMap<LinkModel> | undefined>(undefined);
    const wsRef = useRef<ReconnectingWebSocket | undefined>();
    const { user, setUser } = useContext(AppContext);
    const [curUserId, setCurUserId] = useState<string | undefined>(undefined);

    const refreshFiles = useCallback(async () => {
        if (!user) {
            setFiles({});
            return;
        }
        const files = await FileModel.getByUser(user);
        const fileMap: ModelMap<FileModel> = {};
        for (const file of files) {
            fileMap[file.id] = file;
        }
        setFiles(fileMap);
    }, [user]);

    const refreshLinks = useCallback(async () => {
        if (!user) {
            setLinks({});
            return;
        }
        const links = await LinkModel.getByUser(user);
        const linkMap: ModelMap<LinkModel> = {};
        for (const link of links) {
            linkMap[link.id] = link;
        }
        setLinks(linkMap);
    }, [user]);

    const handleLiveLoadMessage = useCallback(
        (data: LiveLoadingPayload) => {
            switch (data.model) {
                case 'file':
                    if (!files) {
                        break;
                    }
                    const file = data.data as FileModel;
                    const fileMapCopy = { ...files };
                    switch (data.action) {
                        case 'update':
                            const oldFile = fileMapCopy[file.id];
                            if (!oldFile) {
                                break;
                            }
                            oldFile.wrap(file);
                            setFiles(fileMapCopy);
                            break;
                        case 'create':
                            if (fileMapCopy[file.id]) {
                                break;
                            }
                            fileMapCopy[file.id] = FileModel.wrapNew(file);
                            setFiles(fileMapCopy);
                            break;
                        case 'delete':
                            if (!fileMapCopy[file.id]) {
                                break;
                            }
                            delete fileMapCopy[file.id];
                            setFiles(fileMapCopy);
                            break;
                    }
                    break;
                case 'link':
                    if (!links) {
                        break;
                    }
                    const link = data.data as LinkModel;
                    const linkMapCopy = { ...links };
                    switch (data.action) {
                        case 'update':
                            const oldModel = linkMapCopy[link.id];
                            if (!oldModel) {
                                break;
                            }
                            oldModel.wrap(link);
                            setLinks(linkMapCopy);
                            break;
                        case 'create':
                            if (linkMapCopy[link.id]) {
                                break;
                            }
                            linkMapCopy[link.id] = LinkModel.wrapNew(link);
                            setLinks(linkMapCopy);
                            break;
                        case 'delete':
                            if (!linkMapCopy[link.id]) {
                                break;
                            }
                            delete linkMapCopy[link.id];
                            setLinks(linkMapCopy);
                            break;
                    }
                    break;
                case 'user':
                    if (data.action !== 'update') {
                        break;
                    }
                    const newUser = data.data as UserDetailsModel;
                    if (!user || newUser.id !== user.id) {
                        break;
                    }
                    const mergedNewUser = UserDetailsModel.wrapNew(user.wrap(newUser));
                    setUser(mergedNewUser);
                    break;
            }
        },
        [files, links, setUser, user],
    );

    const handleWebSocketMessage = useCallback(
        (event: MessageEvent<any>) => {
            const data = JSON.parse(event.data);
            if (data.type !== 'liveloading') {
                return;
            }
            handleLiveLoadMessage(data as LiveLoadingPayload);
        },
        [handleLiveLoadMessage],
    );

    useEffect(() => {
        if (wsRef.current) {
            return;
        }

        const url = new URL(document.location.href);
        url.pathname = '/api/v1/ws/events';
        url.search = '';
        url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
        const thisWs = new ReconnectingWebSocket(url.href);
        wsRef.current = thisWs;

        return () => {
            thisWs?.close();
        };
    }, []);

    useEffect(() => {
        wsRef.current?.setOnMessage(handleWebSocketMessage);
    }, [handleWebSocketMessage]);

    useEffect(() => {
        const newUserId = user?.id;
        if (newUserId === curUserId) {
            return;
        }
        setCurUserId(newUserId);
        setFiles(undefined);
        setLinks(undefined);
    }, [curUserId, user]);

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

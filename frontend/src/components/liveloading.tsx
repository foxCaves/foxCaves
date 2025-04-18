import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FileModel } from '../models/file';
import { LinkModel } from '../models/link';
import { NewsModel } from '../models/news';
import { UserDetailsModel } from '../models/user';
import { AppContext } from '../utils/context';
import { noop } from '../utils/misc';
import { ReconnectingWebSocket } from '../utils/websocket_autoreconnect';

export type ModelMap<T> = Map<string, T>;

interface ModelContext<T> {
    models: ModelMap<T> | undefined;
    set: (arr: ModelMap<T>) => void;
    refresh: () => Promise<void>;
}

interface LiveLoadingPayload {
    action: 'create' | 'delete' | 'update';
    model: 'file' | 'link' | 'news' | 'user';
    data: unknown;
}

interface LiveLoadingContainerInterface {
    readonly children?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const FilesContext = React.createContext<ModelContext<FileModel>>({} as ModelContext<FileModel>);
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const LinksContext = React.createContext<ModelContext<LinkModel>>({} as ModelContext<LinkModel>);
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const NewsContext = React.createContext<ModelContext<NewsModel>>({} as ModelContext<NewsModel>);

// eslint-disable-next-line max-lines-per-function
export const LiveLoadingContainer: React.FC<LiveLoadingContainerInterface> = ({ children }) => {
    const [news, setNews] = useState<ModelMap<NewsModel> | undefined>(undefined);
    const [files, setFiles] = useState<ModelMap<FileModel> | undefined>(undefined);
    const [links, setLinks] = useState<ModelMap<LinkModel> | undefined>(undefined);
    const wsRef = useRef<ReconnectingWebSocket | undefined>(undefined);
    const { user, setUser, apiAccessor } = useContext(AppContext);
    const [curUserId, setCurUserId] = useState<string | undefined>(undefined);

    const refreshFiles = useCallback(async () => {
        if (!user) {
            setFiles(new Map());
            return;
        }

        const fileArray = await FileModel.getByUser(user, apiAccessor);
        const fileMap: ModelMap<FileModel> = new Map();
        for (const file of fileArray) {
            fileMap.set(file.id, file);
        }

        setFiles(fileMap);
    }, [user, apiAccessor]);

    const refreshLinks = useCallback(async () => {
        if (!user) {
            setLinks(new Map());
            return;
        }

        const linkArray = await LinkModel.getByUser(user, apiAccessor);
        const linkMap: ModelMap<LinkModel> = new Map();
        for (const link of linkArray) {
            linkMap.set(link.id, link);
        }

        setLinks(linkMap);
    }, [user, apiAccessor]);

    const refreshNews = useCallback(async () => {
        const newsArray = await NewsModel.getAll(apiAccessor);
        const newsMap: ModelMap<NewsModel> = new Map();
        for (const newsItem of newsArray) {
            newsMap.set(newsItem.id, newsItem);
        }

        setNews(newsMap);
    }, [apiAccessor]);

    const handleLiveLoadMessage = useCallback(
        // eslint-disable-next-line complexity
        (data: LiveLoadingPayload) => {
            switch (data.model) {
                case 'file': {
                    if (!files) {
                        break;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const file = data.data as FileModel;
                    const fileMapCopy = new Map(files);
                    switch (data.action) {
                        case 'update': {
                            const oldFile = fileMapCopy.get(file.id);
                            if (!oldFile) {
                                break;
                            }

                            oldFile.wrap(file);
                            setFiles(fileMapCopy);
                            break;
                        }

                        case 'create': {
                            if (fileMapCopy.has(file.id)) {
                                break;
                            }

                            fileMapCopy.set(file.id, FileModel.wrapNew(file));
                            setFiles(fileMapCopy);
                            break;
                        }

                        case 'delete': {
                            if (!fileMapCopy.has(file.id)) {
                                break;
                            }

                            fileMapCopy.delete(file.id);
                            setFiles(fileMapCopy);
                            break;
                        }
                    }

                    break;
                }

                case 'link': {
                    if (!links) {
                        break;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const link = data.data as LinkModel;
                    const linkMapCopy = new Map(links);
                    switch (data.action) {
                        case 'update': {
                            const oldModel = linkMapCopy.get(link.id);
                            if (!oldModel) {
                                break;
                            }

                            oldModel.wrap(link);
                            setLinks(linkMapCopy);
                            break;
                        }

                        case 'create': {
                            if (linkMapCopy.has(link.id)) {
                                break;
                            }

                            linkMapCopy.set(link.id, LinkModel.wrapNew(link));
                            setLinks(linkMapCopy);
                            break;
                        }

                        case 'delete': {
                            if (linkMapCopy.has(link.id)) {
                                break;
                            }

                            linkMapCopy.delete(link.id);
                            setLinks(linkMapCopy);
                            break;
                        }
                    }

                    break;
                }

                case 'user': {
                    if (data.action !== 'update') {
                        break;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const newUser = data.data as UserDetailsModel;
                    if (!user || newUser.id !== user.id) {
                        break;
                    }

                    const mergedNewUser = UserDetailsModel.wrapNew(user.wrap(newUser));
                    setUser(mergedNewUser);
                    break;
                }

                case 'news': {
                    if (!news) {
                        break;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    const newsItem = data.data as NewsModel;
                    const newsMapCopy = new Map(news);
                    switch (data.action) {
                        case 'update': {
                            const oldNews = newsMapCopy.get(newsItem.id);
                            if (!oldNews) {
                                break;
                            }

                            oldNews.wrap(newsItem);
                            setNews(newsMapCopy);
                            break;
                        }

                        case 'create': {
                            if (newsMapCopy.has(newsItem.id)) {
                                break;
                            }

                            newsMapCopy.set(newsItem.id, NewsModel.wrapNew(newsItem));
                            setNews(newsMapCopy);
                            break;
                        }

                        case 'delete': {
                            if (!newsMapCopy.has(newsItem.id)) {
                                break;
                            }

                            newsMapCopy.delete(newsItem.id);
                            setNews(newsMapCopy);
                            break;
                        }
                    }

                    break;
                }
            }
        },
        [files, links, news, setUser, user],
    );

    const handleWebSocketMessage = useCallback(
        (event: MessageEvent) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const data = JSON.parse(event.data as string) as unknown;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            if ((data as { type: string }).type !== 'liveLoading') {
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            handleLiveLoadMessage(data as LiveLoadingPayload);
        },
        [handleLiveLoadMessage],
    );

    useEffect(() => {
        if (!curUserId) {
            wsRef.current?.close();
            wsRef.current = undefined;
            return noop;
        }

        if (wsRef.current) {
            return noop;
        }

        const url = new URL(document.location.href);
        url.pathname = '/api/v1/ws/events';
        url.search = '';
        url.protocol = url.protocol === 'http:' ? 'ws:' : 'wss:';
        const thisWs = new ReconnectingWebSocket(url.href);
        wsRef.current = thisWs;

        return () => {
            thisWs.close();
            if (wsRef.current === thisWs) {
                wsRef.current = undefined;
            }
        };
    }, [curUserId]);

    useEffect(() => {
        if (!user) {
            return;
        }

        wsRef.current?.setOnMessage(handleWebSocketMessage);
    }, [user, handleWebSocketMessage]);

    useEffect(() => {
        const newUserId = user?.id;
        if (newUserId === curUserId) {
            return;
        }

        setCurUserId(newUserId);
        setFiles(undefined);
        setLinks(undefined);
    }, [curUserId, user]);

    const linksContext = useMemo(
        () => ({
            models: links,
            set: setLinks,
            refresh: refreshLinks,
        }),
        [links, refreshLinks, setLinks],
    );

    const filesContext = useMemo(
        () => ({
            models: files,
            set: setFiles,
            refresh: refreshFiles,
        }),
        [files, refreshFiles, setFiles],
    );

    const newsContext = useMemo(
        () => ({
            models: news,
            set: setNews,
            refresh: refreshNews,
        }),
        [news, refreshNews, setNews],
    );

    return (
        <NewsContext.Provider value={newsContext}>
            <LinksContext.Provider value={linksContext}>
                <FilesContext.Provider value={filesContext}>{children}</FilesContext.Provider>
            </LinksContext.Provider>
        </NewsContext.Provider>
    );
};

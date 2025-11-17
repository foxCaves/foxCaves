import React, { useContext, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Link } from 'react-router';
import { ModelMap, NewsContext } from '../components/liveloading';
import { NewsModel } from '../models/news';
import { config, frontendRevision } from '../utils/config';
import { logError, sortByDate } from '../utils/misc';

const NewsView: React.FC<{
    readonly newsItem: NewsModel;
}> = ({ newsItem }) => {
    return (
        <>
            <h4>{newsItem.title}</h4>
            <p>
                <Markdown>{newsItem.content}</Markdown>
            </p>
        </>
    );
};

const NewsList: React.FC<{
    readonly news?: ModelMap<NewsModel>;
    readonly loading: boolean;
}> = ({ news, loading }) => {
    if (loading || !news) {
        return <h4>Loading...</h4>;
    }

    const ret = Array.from(news.values())
        // eslint-disable-next-line unicorn/no-array-sort
        .sort(sortByDate)
        .map((newsItem) => <NewsView key={newsItem.id} newsItem={newsItem} />);

    return ret;
};

export const HomePage: React.FC = () => {
    const { refresh, models } = useContext(NewsContext);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (loading || models) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        refresh().then(() => {
            setLoading(false);
        }, logError);
    }, [refresh, loading, models]);

    return (
        <>
            <h1>Home</h1>
            <h2>Welcome to foxCaves!</h2>
            <h3>News</h3>
            <NewsList loading={loading} news={models} />
            <h3>Links and things</h3>
            <h4>What is foxCaves?</h4>
            <p>
                foxCaves is a platform to upload your files and share them with friends as well create links.
                <br />
                There is pre-made configurations for ShareX here:{' '}
                <a href="https://github.com/foxCaves/sharex" rel="noreferrer" target="_blank">
                    https://github.com/foxCaves/sharex
                </a>
                <br />
                <br />
                You can also see the full source code of this project at:{' '}
                <a href="https://github.com/foxCaves/foxCaves" rel="noreferrer" target="_blank">
                    https://github.com/foxCaves/foxCaves
                </a>
                <br />
                Frontend revision: {frontendRevision}
                <br />
                Backend revision: {config.backend_revision}
            </p>
            <h4>Legal</h4>
            <p>
                <Link to="/legal/terms_of_service">Terms of service</Link>
                <br />
                <Link to="/legal/privacy_policy">Privacy policy</Link>
            </p>
        </>
    );
};

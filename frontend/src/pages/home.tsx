import React from 'react';
import { Link } from 'react-router-dom';
import { config, frontendRevision } from '../utils/config';

export const HomePage: React.FC = () => {
    return (
        <>
            <h1>Home</h1>
            <br />
            <h3>Welcome to foxCaves!</h3>
            <br />
            <h4>What is foxCaves?</h4>
            <p>
                foxCaves is a platform to upload your files and share them with friends as well create short-links.
                <br />
                There is pre-made configurations for ShareX here:{' '}
                <a href="https://github.com/foxCaves/sharex" rel="noreferrer" target="_blank">
                    https://github.com/foxCaves/sharex
                </a>
                <br />
                <br />
                You can also see the full source code of this project at:{' '}
                <a href="https://github.com/foxCaves/site" rel="noreferrer" target="_blank">
                    https://github.com/foxCaves/site
                </a>
                <br />
                Frontend revision: {frontendRevision}
                <br />
                Backend revision: {config.backend_revision}
            </p>
            <br />
            <h4>Legal</h4>
            <p>
                <Link to="/legal/terms_of_service">Terms of service</Link>
                <br />
                <Link to="/legal/privacy_policy">Privacy policy</Link>
            </p>
        </>
    );
};

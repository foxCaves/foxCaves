import React from 'react';
import { Link } from 'react-router';
import { config, frontendRevision } from '../utils/config';

export const HomePage: React.FC = () => {
    return (
        <>
            <h1>Home</h1>
            <br />
            <h3>Welcome to foxCaves!</h3>
            <br />
            <h4>Domain move</h4>
            <p>
                Please note this site has moved domains!
                <br />
                <br />
                We are now online at{' '}
                <a href="https://foxcaves.doridian.net" rel="noreferrer" target="_blank">
                    https://foxcaves.doridian.net
                </a>
                <br />
                <br />
                All links have also changed from <strong>https://f0x.es</strong> to{' '}
                <strong>https://fcv.doridian.net</strong>
                <br />
                <br />
                Please update your bookmarks and links accordingly!
            </p>
            <br />
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

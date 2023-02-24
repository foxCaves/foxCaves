import React from 'react';

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
                You can also see the full source code of this project at:{' '}
                <a href="https://github.com/foxCaves/site" rel="noreferrer" target="_blank">
                    https://github.com/foxCaves/site
                </a>
            </p>
        </>
    );
};

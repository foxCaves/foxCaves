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
                foxCaves is a platform to upload your files and share them with friends as well create shortlinks.<br />
                There is pre-made configurations for ShareX here: <a
                    rel="noreferrer" target="_blank" href="https://github.com/foxCaves/sharex">https://github.com/foxCaves/sharex</a><br />
                You can also see the full source code of this project at: <a
                    rel="noreferrer" target="_blank" href="https://github.com/foxCaves/site">https://github.com/foxCaves/site</a>
            </p>
        </>
    );
};

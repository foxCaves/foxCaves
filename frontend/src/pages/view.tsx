import React from 'react';
import { useParams } from 'react-router-dom';

export const ViewPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return (
        <>
            <h1>View file: {id}</h1>
            <br />
            <p>This is the home page</p>
        </>
    );
};

import React, { useEffect } from 'react';

export const LogoutPage: React.FC = () => {
    useEffect(() => {
        document.location.href = '/api/v1/users/sessions/logout';
    });

    return <h1>Logging out...</h1>;
};

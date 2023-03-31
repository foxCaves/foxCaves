import React, { useContext, useEffect } from 'react';
import { AppContext } from '../utils/context';

export const LogoutPage: React.FC = () => {
    const { userLoaded } = useContext(AppContext);

    useEffect(() => {
        if (!userLoaded) {
            return;
        }

        document.location.href = `/api/v1/users/sessions/logout?d=${Date.now()}`;
    }, [userLoaded]);

    return <h1>Logging out...</h1>;
};

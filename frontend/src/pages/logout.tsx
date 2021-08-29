import React, { useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { Redirect } from 'react-router-dom';

export const LogoutPage: React.FC = () => {
    const { showAlert, refreshUser } = useContext(AppContext);
    const [logoutDone, setLogoutDone] = useState(false);
    const [logoutStarted, setLogoutStarted] = useState(false);

    const logoutAPI = useCallback(async () => {
        try {
            await fetchAPIRaw('/api/v1/users/sessions/logout', {
                method: 'POST',
            });
        } catch (err: any) {
            showAlert({
                id: 'logout',
                contents: `Error logging out: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }

        showAlert({
            id: 'logout',
            contents: 'Logged out!',
            variant: 'success',
            timeout: 5000,
        });
    }, [showAlert]);

    const logout = useCallback(async () => {
        setLogoutStarted(true);
        await logoutAPI();
        refreshUser();
        setLogoutDone(true);
        setLogoutStarted(false);
    }, [logoutAPI, refreshUser]);

    useEffect(() => {
        if (logoutDone || logoutStarted) {
            return;
        }

        logout();
    }, [logoutDone, logoutStarted, logout]);

    if (logoutDone) {
        return <Redirect to="/" />;
    }

    return <h1>Logging out...</h1>;
};

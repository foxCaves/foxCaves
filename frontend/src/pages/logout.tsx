import React, { useContext, useState, useEffect, useCallback } from 'react';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { Redirect } from 'react-router-dom';
import { toast } from 'react-toastify';

export const LogoutPage: React.FC = () => {
    const { refreshUser } = useContext(AppContext);
    const [logoutDone, setLogoutDone] = useState(false);
    const [logoutStarted, setLogoutStarted] = useState(false);

    const logoutAPI = useCallback(async () => {
        try {
            await fetchAPIRaw('/api/v1/users/sessions/logout', {
                method: 'POST',
            });
        } catch (err: any) {
            toast(`Error logging out: ${err.message}`, {
                type: 'error',
                autoClose: 5000,
            });
            return;
        }

        toast('Logged out!', {
            type: 'success',
            autoClose: 5000,
        });
    }, []);

    const logout = useCallback(async () => {
        setLogoutStarted(true);
        await logoutAPI();
        await refreshUser();
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

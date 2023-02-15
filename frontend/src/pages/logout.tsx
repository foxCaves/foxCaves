import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { logError } from '../utils/misc';

export const LogoutPage: React.FC = () => {
    const { refreshUser } = useContext(AppContext);
    const [logoutDone, setLogoutDone] = useState(false);
    const [logoutStarted, setLogoutStarted] = useState(false);

    const logout = useCallback(async () => {
        setLogoutStarted(true);
        try {
            await toast.promise(
                fetchAPIRaw('/api/v1/users/sessions/logout', {
                    method: 'POST',
                }),
                {
                    success: 'Logged out!',
                    pending: 'Logging out...',
                    error: {
                        render({ data }) {
                            const err = data as Error;
                            return `Error logging out: ${err.message}`;
                        },
                    },
                },
            );
        } catch {}

        await refreshUser();
        setLogoutDone(true);
        setLogoutStarted(false);
    }, [refreshUser]);

    useEffect(() => {
        if (logoutDone || logoutStarted) {
            return;
        }

        logout().catch(logError);
    }, [logoutDone, logoutStarted, logout]);

    if (logoutDone) {
        return <Navigate to="/" />;
    }

    return <h1>Logging out...</h1>;
};

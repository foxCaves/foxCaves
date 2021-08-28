import React from 'react';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { Redirect } from 'react-router-dom';
import { useEffect } from 'react';
import { useState } from 'react';

export const LogoutPage: React.FC = () => {
    const ctx = React.useContext(AppContext);
    const [logoutDone, setLogoutDone] = useState(false);
    const [logoutStarted, setLogoutStarted] = useState(false);

    useEffect(() => {
        if (logoutDone || logoutStarted) {
            return;
        }

        async function logoutAPI() {
            try {
                await fetchAPIRaw('/api/v1/users/sessions/logout', {
                    method: 'POST',
                });
            } catch (err) {
                ctx.showAlert({
                    id: 'logout',
                    contents: `Error logging out: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
                return;
            }

            ctx.showAlert({
                id: 'logout',
                contents: 'Logged out!',
                variant: 'success',
                timeout: 5000,
            });
        }

        async function logout() {
            setLogoutStarted(true);
            await logoutAPI();
            ctx.refreshUser();
            setLogoutDone(true);
            setLogoutStarted(false);
        }
        logout();
    });

    if (logoutDone) {
        return <Redirect to="/" />;
    }

    return <h1>Logging out...</h1>;
}

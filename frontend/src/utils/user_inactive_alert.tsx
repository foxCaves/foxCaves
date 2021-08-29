import React, { useContext } from 'react';
import { AppContext } from '../utils/context';
import Alert from 'react-bootstrap/Alert';
import { useCallback } from 'react';
import { fetchAPIRaw } from './api';

export const UserInactiveAlert: React.FC = () => {
    const { user, showAlert } = useContext(AppContext);

    const requestActivationEmail = useCallback(async () => {
        if (!user) {
            return;
        }

        try {
            await fetchAPIRaw('/api/v1/users/emails/request', {
                method: 'POST',
                body: {
                    action: 'activation',
                    email: user.email,
                    username: user.username,
                },
            });
            showAlert({
                id: 'activation',
                variant: 'success',
                contents: 'Activation E-Mail sent!',
                timeout: 5000,
            });
        } catch (err: any) {
            showAlert({
                id: 'activation',
                variant: 'danger',
                contents: `Error requesting new activation E-Mail: ${err.message}`,
                timeout: 10000,
            });
        }
    }, [user, showAlert]);

    if (!user || user.isActive()) {
        return null;
    }

    return (
        <Alert variant="danger">
            <Alert.Heading>Your account is inactive</Alert.Heading>
            <p>
                Your account is inactive. Make sure to click the link in your activation E-Mail.
                <br />
                While your account is inactive, you can not upload or edit files, and you cannot shorten links.
            </p>
            <Alert.Link onClick={requestActivationEmail}>Re-send activation E-Mail</Alert.Link>
        </Alert>
    );
};

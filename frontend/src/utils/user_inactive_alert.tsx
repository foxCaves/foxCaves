import React, { useContext } from 'react';
import { AppContext } from '../utils/context';
import Alert from 'react-bootstrap/Alert';
import { useCallback } from 'react';
import { fetchAPIRaw } from './api';
import { toast } from 'react-toastify';

export const UserInactiveAlert: React.FC = () => {
    const { user } = useContext(AppContext);

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
            toast('Activation E-Mail sent!', {
                type: 'success',
                autoClose: 5000,
            });
        } catch (err: any) {
            toast(`Error requesting new activation E-Mail: ${err.message}`, {
                type: 'error',
                autoClose: 10000,
            });
        }
    }, [user]);

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

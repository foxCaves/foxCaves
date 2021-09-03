import React, { useContext } from 'react';
import { AppContext } from '../utils/context';
import Alert from 'react-bootstrap/Alert';
import { useCallback } from 'react';
import { fetchAPIRaw } from '../utils/api';
import { toast } from 'react-toastify';

export const UserInactiveAlert: React.FC = () => {
    const { user } = useContext(AppContext);

    const requestActivationEmail = useCallback(async () => {
        if (!user) {
            return;
        }

        try {
            await toast.promise(
                fetchAPIRaw('/api/v1/users/emails/request', {
                    method: 'POST',
                    data: {
                        action: 'activation',
                        email: user.email,
                        username: user.username,
                    },
                }),
                {
                    success: 'Activation E-Mail sent!',
                    pending: 'Requesting new activation E-Mail...',
                    error: {
                        render({ data }) {
                            const err = data as Error;
                            return `Error requesting new activation E-Mail: ${err.message}`;
                        },
                    },
                },
            );
        } catch {}
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

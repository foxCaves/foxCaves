import React, { useCallback, useContext } from 'react';
import Alert from 'react-bootstrap/Alert';
import { toast } from 'react-toastify';
import { AppContext } from '../utils/context';
import { logError } from '../utils/misc';

export const UserEmailValidAlert: React.FC = () => {
    const { user, apiAccessor } = useContext(AppContext);

    const requestActivationEmail = useCallback(() => {
        if (!user) {
            return;
        }

        toast
            .promise(
                apiAccessor.fetch('/api/v1/users/emails/request', {
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
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            const err = data as Error;
                            return `Error requesting new activation E-Mail: ${err.message}`;
                        },
                    },
                },
            )
            .catch(logError);
    }, [user, apiAccessor]);

    if (!user || user.isValidEmail()) {
        return null;
    }

    return (
        <Alert variant="danger">
            <Alert.Heading>Your E-Mail is not validated</Alert.Heading>
            <p>
                Your account is inactive. Make sure to click the link in your activation E-Mail.
                <br />
                While your account is inactive, you can not upload or edit files, and you cannot create links.
            </p>
            <Alert.Link onClick={requestActivationEmail}>Re-send activation E-Mail</Alert.Link>
        </Alert>
    );
};

import React, { useContext } from 'react';
import Alert from 'react-bootstrap/Alert';
import { config } from '../utils/config';
import { AppContext } from '../utils/context';

export const UserNotApprovedAlert: React.FC = () => {
    const { user } = useContext(AppContext);

    // Do not show this when user didn't activate E-Mail, yet
    if (!user || !user.isValidEmail() || user.isApproved()) {
        return null;
    }

    if (user.approved < 0) {
        const adminEmail = config.admin_email;
        return (
            <Alert variant="danger">
                <Alert.Heading>Your account approval has been denied</Alert.Heading>
                <p>
                    Please contact an administrator at <a href={`mailto:${adminEmail}`}>{adminEmail}</a> for more
                    information.
                    <br />
                    While your account is inactive, you can not upload or edit files, and you cannot create links.
                </p>
            </Alert>
        );
    }

    return (
        <Alert variant="danger">
            <Alert.Heading>Your account is not approved</Alert.Heading>
            <p>
                Your account is inactive. Please wait for an administrator to approve your account.
                <br />
                While your account is inactive, you can not upload or edit files, and you cannot create links.
            </p>
        </Alert>
    );
};

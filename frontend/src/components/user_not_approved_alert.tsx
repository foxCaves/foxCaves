import React, { useContext } from 'react';
import Alert from 'react-bootstrap/Alert';
import { AppContext } from '../utils/context';

export const UserNotApprovedAlert: React.FC = () => {
    const { user } = useContext(AppContext);

    // Do not show this when user didn't activate E-Mail, yet
    if (!user || !user.isValidEmail() || user.isApproved()) {
        return null;
    }

    return (
        <Alert variant="danger">
            <Alert.Heading>Your account is not approved, yet</Alert.Heading>
            <p>Please wait on administrator approval of your account.</p>
        </Alert>
    );
};

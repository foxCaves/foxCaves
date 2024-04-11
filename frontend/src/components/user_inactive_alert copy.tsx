import React, { useContext } from 'react';
import Alert from 'react-bootstrap/Alert';
import { AppContext } from '../utils/context';

export const UserInactiveAlert: React.FC = () => {
    const { user } = useContext(AppContext);

    if (!user || !user.isValidEmail() || user.isActive()) {
        return null;
    }

    return (
        <Alert variant="danger">
            <Alert.Heading>Your account is inactive</Alert.Heading>
            <p>Your account is inactive. Please wait on administrator approval of your account.</p>
        </Alert>
    );
};

import React, { useCallback, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { AppContext } from '../utils/context';
import { logError } from '../utils/misc';

export const LogoutPage: React.FC = () => {
    const { userLoaded, refreshUser, apiAccessor } = useContext(AppContext);

    const declineLogOut = useCallback(() => {
        document.location.href = '/';
    }, []);

    const acceptLogOutAsync = useCallback(async () => {
        try {
            await toast.promise(
                apiAccessor
                    .fetch('/api/v1/users/sessions', {
                        method: 'DELETE',
                    })
                    .then(refreshUser),
                {
                    success: 'Logged out!',
                    pending: 'Logging out...',
                    error: {
                        render({ data }) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                            const err = data as Error;
                            return `Error logging out: ${err.message}`;
                        },
                    },
                },
            );

            document.location.href = '/';
        } catch (error: unknown) {
            logError(error);
            await refreshUser();
        }
    }, [refreshUser, apiAccessor]);

    const acceptLogOut = useCallback(() => {
        acceptLogOutAsync().catch(logError);
    }, [acceptLogOutAsync]);

    if (!userLoaded) {
        return (
            <>
                <h1>Logout</h1>
                <br />
                <h3>Loading...</h3>
            </>
        );
    }

    return (
        <>
            <Modal show>
                <Modal.Header>
                    <Modal.Title>Log out?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure you want to log out?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={declineLogOut} variant="secondary">
                        No
                    </Button>
                    <Button onClick={acceptLogOut} variant="primary">
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>Logout</h1>
            <br />
            <h3>Please see modal dialog</h3>
        </>
    );
};

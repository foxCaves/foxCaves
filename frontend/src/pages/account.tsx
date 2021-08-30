import React, { FormEvent, useEffect, useContext, useState, useCallback } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Modal from 'react-bootstrap/Modal';
import { Col, Row } from 'react-bootstrap';
import { useInputFieldSetter } from '../utils/hooks';
import { toast } from 'react-toastify';

export const AccountPage: React.FC = () => {
    const { user, refreshUser } = useContext(AppContext);
    const userEmail = user!.email!;

    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [currentPassword, setCurrentPasswordCB] = useInputFieldSetter('');
    const [newPassword, setNewPasswordCB] = useInputFieldSetter('');
    const [newPasswordConfirm, setNewPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB, setEmail] = useInputFieldSetter(userEmail);

    useEffect(() => {
        setEmail(userEmail!);
    }, [userEmail, setEmail]);

    const sendUserChange = useCallback(
        async (body: { [key: string]: string }, method: string = 'PATCH') => {
            body.current_password = currentPassword;
            try {
                await toast.promise(
                    fetchAPIRaw(`/api/users/${user!.id}`, {
                        method,
                        body,
                    }),
                    {
                        pending: 'Saving your account...',
                        success: 'Your account changes have been saved!',
                        error: {
                            render({ data }) {
                                const err = data as Error;
                                return `Error changing account: ${err.message}`;
                            },
                        },
                    },
                );
            } catch {}
            await refreshUser();
        },
        [currentPassword, refreshUser, user],
    );

    const handleAPIKeyRegen = useCallback(
        async (event: FormEvent) => {
            event.preventDefault();
            await sendUserChange({
                apikey: 'CHANGE',
            });
        },
        [sendUserChange],
    );

    const handleDeleteAccount = useCallback(
        async (event: FormEvent) => {
            event.preventDefault();
            await sendUserChange({}, 'DELETE');
            setShowDeleteAccountModal(false);
        },
        [sendUserChange],
    );

    const handleKillSessions = useCallback(
        async (event: FormEvent) => {
            event.preventDefault();
            await sendUserChange({
                loginkey: 'CHANGE',
            });
        },
        [sendUserChange],
    );

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (newPassword !== newPasswordConfirm) {
                toast('New passwords do not match', {
                    type: 'error',
                    autoClose: 5000,
                });
                return;
            }

            await sendUserChange({
                password: newPassword,
                email: email,
            });
        },
        [sendUserChange, newPassword, newPasswordConfirm, email],
    );

    const doShowDeleteAccountModal = useCallback(() => {
        setShowDeleteAccountModal(true);
    }, []);

    const doHideDeleteAccountModal = useCallback(() => {
        setShowDeleteAccountModal(false);
    }, []);

    return (
        <>
            <Modal show={showDeleteAccountModal} onHide={doHideDeleteAccountModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete account</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure to delete your account?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={doHideDeleteAccountModal}>
                        No
                    </Button>
                    <Button variant="danger" onClick={handleDeleteAccount}>
                        Yes, delete all my data
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>Manage account</h1>
            <br />
            <Form onSubmit={handleSubmit}>
                <FloatingLabel className="mb-3" label="Current password">
                    <Form.Control
                        name="currentPassword"
                        type="password"
                        placeholder="password"
                        required
                        value={currentPassword}
                        onChange={setCurrentPasswordCB}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Username">
                    <Form.Control readOnly name="username" type="text" placeholder="testuser" value={user!.username} />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="New password">
                    <Form.Control
                        name="newPassword"
                        type="password"
                        placeholder="password"
                        value={newPassword}
                        onChange={setNewPasswordCB}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Confirm new password">
                    <Form.Control
                        name="newPasswordConfirm"
                        type="password"
                        placeholder="password"
                        value={newPasswordConfirm}
                        onChange={setNewPasswordConfirmCB}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        type="email"
                        placeholder="test@example.com"
                        value={email}
                        onChange={setEmailCB}
                    />
                    <Form.Label>E-Mail</Form.Label>
                </FloatingLabel>
                <Row>
                    <Col>
                        <FloatingLabel className="mb-3" label="API key">
                            <Form.Control
                                readOnly
                                name="apikey"
                                type="text"
                                placeholder="ABCDefgh"
                                value={user!.apikey!}
                            />
                            <Form.Label>API key</Form.Label>
                        </FloatingLabel>
                    </Col>
                    <Col xs="auto">
                        <Button variant="primary" type="button" size="lg" onClick={handleAPIKeyRegen}>
                            Regenerate
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button variant="primary" type="submit" size="lg">
                            Change password / E-Mail
                        </Button>
                    </Col>
                    <Col>
                        <Button variant="warning" type="button" size="lg" onClick={handleKillSessions}>
                            Kill all sessions
                        </Button>
                    </Col>
                    <Col>
                        <Button variant="danger" type="button" size="lg" onClick={doShowDeleteAccountModal}>
                            Delete account
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

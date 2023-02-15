import React, { FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { useInputFieldSetter } from '../utils/hooks';

export const AccountPage: React.FC = () => {
    const { user, refreshUser } = useContext(AppContext);
    const userEmail = user!.email;

    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [currentPassword, setCurrentPasswordCB] = useInputFieldSetter('');
    const [newPassword, setNewPasswordCB] = useInputFieldSetter('');
    const [newPasswordConfirm, setNewPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB, setEmail] = useInputFieldSetter(userEmail);

    useEffect(() => {
        setEmail(userEmail);
    }, [userEmail, setEmail]);

    const sendUserChange = useCallback(
        async (body: Record<string, string>, method = 'PATCH') => {
            body.current_password = currentPassword;
            try {
                await toast.promise(
                    fetchAPIRaw(`/api/users/${encodeURIComponent(user!.id)}`, {
                        method,
                        data: body,
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
                email,
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
            <Modal onHide={doHideDeleteAccountModal} show={showDeleteAccountModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete account</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure to delete your account?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={doHideDeleteAccountModal} variant="secondary">
                        No
                    </Button>
                    <Button onClick={handleDeleteAccount} variant="danger">
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
                        onChange={setCurrentPasswordCB}
                        placeholder="password"
                        required
                        type="password"
                        value={currentPassword}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Username">
                    <Form.Control name="username" placeholder="testuser" readOnly type="text" value={user!.username} />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="New password">
                    <Form.Control
                        name="newPassword"
                        onChange={setNewPasswordCB}
                        placeholder="password"
                        type="password"
                        value={newPassword}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Confirm new password">
                    <Form.Control
                        name="newPasswordConfirm"
                        onChange={setNewPasswordConfirmCB}
                        placeholder="password"
                        type="password"
                        value={newPasswordConfirm}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        onChange={setEmailCB}
                        placeholder="test@example.com"
                        type="email"
                        value={email}
                    />
                    <Form.Label>E-Mail</Form.Label>
                </FloatingLabel>
                <Row>
                    <Col>
                        <FloatingLabel className="mb-3" label="API key">
                            <Form.Control
                                name="apikey"
                                placeholder="ABCDefgh"
                                readOnly
                                type="text"
                                value={user!.apikey}
                            />
                            <Form.Label>API key</Form.Label>
                        </FloatingLabel>
                    </Col>
                    <Col xs="auto">
                        <Button onClick={handleAPIKeyRegen} size="lg" type="button" variant="primary">
                            Regenerate
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button size="lg" type="submit" variant="primary">
                            Change password / E-Mail
                        </Button>
                    </Col>
                    <Col>
                        <Button onClick={handleKillSessions} size="lg" type="button" variant="warning">
                            Kill all sessions
                        </Button>
                    </Col>
                    <Col>
                        <Button onClick={doShowDeleteAccountModal} size="lg" type="button" variant="danger">
                            Delete account
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

import React, { FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { AppContext } from '../utils/context';
import { useInputFieldSetter } from '../utils/hooks';
import { assert, logError } from '../utils/misc';

export const AccountPage: React.FC = () => {
    const { user, refreshUser, apiAccessor } = useContext(AppContext);
    assert(user);
    const userEmail = user.email;

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
                    apiAccessor.fetch(`/api/v1/users/${encodeURIComponent(user.id)}`, {
                        method,
                        data: body,
                    }),
                    {
                        pending: 'Saving your account...',
                        success: 'Your account changes have been saved!',
                        error: {
                            render({ data }) {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                const err = data as Error;
                                return `Error changing account: ${err.message}`;
                            },
                        },
                    },
                );
            } catch (error: unknown) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                logError(error as Error);
            }

            await refreshUser();
        },
        [currentPassword, refreshUser, user, apiAccessor],
    );

    const handleAPIKeyRegenerate = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            sendUserChange({
                api_key: 'CHANGE',
            }).catch(logError);
        },
        [sendUserChange],
    );

    const handleDeleteAccount = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            sendUserChange({}, 'DELETE')
                .then(() => {
                    setShowDeleteAccountModal(false);
                })
                .catch(logError);
        },
        [sendUserChange],
    );

    const handleKillSessions = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            sendUserChange({
                security_version: 'CHANGE',
            }).catch(logError);
        },
        [sendUserChange],
    );

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            if (newPassword !== newPasswordConfirm) {
                toast('New passwords do not match', {
                    type: 'error',
                    autoClose: 5000,
                });

                return;
            }

            sendUserChange({
                password: newPassword,
                email,
            }).catch(logError);
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
                    <Form.Control name="username" placeholder="test_user" readOnly type="text" value={user.username} />
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
                                name="api_key"
                                placeholder="ABCDefgh"
                                readOnly
                                type="text"
                                value={user.api_key}
                            />
                            <Form.Label>API key</Form.Label>
                        </FloatingLabel>
                    </Col>
                    <Col xs="auto">
                        <Button onClick={handleAPIKeyRegenerate} size="lg" type="button" variant="primary">
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

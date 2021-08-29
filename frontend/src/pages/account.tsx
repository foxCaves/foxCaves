import React, { FormEvent, useEffect, useContext, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Modal from 'react-bootstrap/Modal';
import { Col, Row } from 'react-bootstrap';

export const AccountPage: React.FC = () => {
    const { user, showAlert, closeAlert, refreshUser } = useContext(AppContext);
    const userEmail = user!.email!;

    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [email, setEmail] = useState(userEmail);

    useEffect(() => {
        setEmail(userEmail!);
    }, [userEmail]);

    async function handleAPIKeyRegen(event: FormEvent) {
        event.preventDefault();
        await sendUserChange({
            apikey: 'CHANGE',
        });
    }

    async function handleDeleteAccount(event: FormEvent) {
        event.preventDefault();
        await sendUserChange({}, 'DELETE');
        setShowDeleteAccountModal(false);
    }

    async function handleKillSessions(event: FormEvent) {
        event.preventDefault();
        await sendUserChange({
            loginkey: 'CHANGE',
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        closeAlert('account');

        if (newPassword !== newPasswordConfirm) {
            showAlert({
                id: 'account',
                contents: 'New passwords do not match',
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }

        await sendUserChange({
            password: newPassword,
            email: email,
        });
    }

    async function sendUserChange(
        body: { [key: string]: string },
        method: string = 'PATCH',
    ) {
        closeAlert('account');
        body.current_password = currentPassword;
        try {
            await fetchAPIRaw(`/api/v1/users/${user!.id}`, {
                method,
                body,
            });
        } catch (err: any) {
            showAlert({
                id: 'account',
                contents: `Error changing account: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return false;
        }
        await refreshUser();
        showAlert({
            id: 'account',
            contents: 'Account change successful!',
            variant: 'success',
            timeout: 2000,
        });
        return true;
    }

    return (
        <>
            <Modal
                show={showDeleteAccountModal}
                onHide={() => setShowDeleteAccountModal(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Delete account</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure to delete your account?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteAccountModal(false)}
                    >
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
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Username">
                    <Form.Control
                        readOnly
                        name="username"
                        type="text"
                        placeholder="testuser"
                        value={user!.username}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="New password">
                    <Form.Control
                        name="newPassword"
                        type="password"
                        placeholder="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Confirm new password">
                    <Form.Control
                        name="newPasswordConfirm"
                        type="password"
                        placeholder="password"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        type="email"
                        placeholder="test@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        <Button
                            variant="primary"
                            type="button"
                            size="lg"
                            onClick={handleAPIKeyRegen}
                        >
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
                        <Button
                            variant="warning"
                            type="button"
                            size="lg"
                            onClick={handleKillSessions}
                        >
                            Kill all sessions
                        </Button>
                    </Col>
                    <Col>
                        <Button
                            variant="danger"
                            type="button"
                            size="lg"
                            onClick={() => setShowDeleteAccountModal(true)}
                        >
                            Delete account
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

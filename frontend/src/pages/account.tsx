import { encode as encodeBase32 } from 'hi-base32';
import { QRCodeSVG } from 'qrcode.react';
import React, { FormEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { config } from '../utils/config';
import { AppContext } from '../utils/context';
import { useInputFieldSetter } from '../utils/hooks';
import { assert, logError } from '../utils/misc';

function generateTotpSecret(): string {
    const vals = new Uint8Array(config.totp.secret_bytes);
    crypto.getRandomValues(vals);
    return encodeBase32(vals);
}

// eslint-disable-next-line max-lines-per-function
export const AccountPage: React.FC = () => {
    const { user, refreshUser, apiAccessor } = useContext(AppContext);
    assert(user);
    const userEmail = user.email;

    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showConfigureTotpModal, setShowConfigureTotpModal] = useState(false);
    const [showForceEnableTotpModal, setShowForceEnableTotpModal] = useState(false);
    const [currentPassword, setCurrentPasswordCB] = useInputFieldSetter('');
    const [newPassword, setNewPasswordCB] = useInputFieldSetter('');
    const [newPasswordConfirm, setNewPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB, setEmail] = useInputFieldSetter(userEmail);
    const [newTotpSecret, setNewTotpSecret] = useState('');
    const [newTotpCode, setNewTotpCode] = useInputFieldSetter('');

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
                logError(error);
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

    const handleDisableTotp = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            sendUserChange({
                totp_secret: 'DISABLE',
            })
                .then(() => {
                    setShowConfigureTotpModal(false);
                })
                .catch(logError);
        },
        [sendUserChange],
    );

    const handleEnableTotp = useCallback(
        (event: FormEvent) => {
            event.preventDefault();
            sendUserChange({
                totp_secret: newTotpSecret,
                totp_code: newTotpCode,
            })
                .then(() => {
                    setShowConfigureTotpModal(false);
                })
                .catch(logError);
        },
        [sendUserChange, newTotpCode, newTotpSecret],
    );

    const doShowConfigureTotpModal = useCallback(() => {
        setNewTotpSecret(generateTotpSecret());
        setShowConfigureTotpModal(true);
    }, []);

    const doShowForceEnableTotpModal = useCallback(() => {
        doShowConfigureTotpModal();
        setShowForceEnableTotpModal(true);
    }, [doShowConfigureTotpModal]);

    const doHideConfigureTotpModal = useCallback(() => {
        setShowConfigureTotpModal(false);
        setShowForceEnableTotpModal(false);
    }, []);

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
                    <Form>
                        <FloatingLabel className="mb-3" label="Current password">
                            <Form.Control
                                name="currentPassword"
                                onChange={setCurrentPasswordCB}
                                placeholder="Password"
                                required
                                type="password"
                                value={currentPassword}
                            />
                        </FloatingLabel>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={doHideDeleteAccountModal} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteAccount} variant="danger">
                        Delete all my data
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                onHide={doHideConfigureTotpModal}
                show={showConfigureTotpModal && !showForceEnableTotpModal ? user.isTOTPEnabled() : undefined}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Configure two-factor</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>To disable two-factor authentication, provide your current password</p>
                    <p>To change to another device, use the "Change" button</p>
                    <Form onSubmit={handleDisableTotp}>
                        <FloatingLabel className="mb-3" label="Current password">
                            <Form.Control
                                name="currentPassword"
                                onChange={setCurrentPasswordCB}
                                placeholder="Password"
                                required
                                type="password"
                                value={currentPassword}
                            />
                        </FloatingLabel>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={doHideConfigureTotpModal} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={doShowForceEnableTotpModal} variant="warning">
                        Change
                    </Button>
                    <Button onClick={handleDisableTotp} variant="danger">
                        Disable
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                onHide={doHideConfigureTotpModal}
                show={showConfigureTotpModal ? showForceEnableTotpModal || !user.isTOTPEnabled() : undefined}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Configure two-factor</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Scan the below code and enter the generated code to enable two-factor authentication.</p>
                    <p className="text-center">
                        <QRCodeSVG
                            value={`otpauth://totp/${encodeURI(user.username)}?secret=${encodeURIComponent(newTotpSecret)}&issuer=${encodeURIComponent(config.totp.issuer)}`}
                        />
                    </p>
                    <p>Secret key: {newTotpSecret}</p>
                    <Form onSubmit={handleEnableTotp}>
                        <FloatingLabel className="mb-3" label="Current password">
                            <Form.Control
                                name="currentPassword"
                                onChange={setCurrentPasswordCB}
                                placeholder="Password"
                                required
                                type="password"
                                value={currentPassword}
                            />
                        </FloatingLabel>
                        <FloatingLabel className="mb-3" label="One-time code">
                            <Form.Control
                                autoComplete="one-time-code"
                                name="totp"
                                onChange={setNewTotpCode}
                                placeholder="One-time code"
                                type="text"
                                value={newTotpCode}
                            />
                        </FloatingLabel>
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={doHideConfigureTotpModal} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleEnableTotp} variant="success">
                        Enable
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
                        placeholder="Password"
                        required
                        type="password"
                        value={currentPassword}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Username">
                    <Form.Control name="username" placeholder="Username" readOnly type="text" value={user.username} />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="New password">
                    <Form.Control
                        name="newPassword"
                        onChange={setNewPasswordCB}
                        placeholder="Password"
                        type="password"
                        value={newPassword}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Confirm new password">
                    <Form.Control
                        name="newPasswordConfirm"
                        onChange={setNewPasswordConfirmCB}
                        placeholder="Password"
                        type="password"
                        value={newPasswordConfirm}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control name="email" onChange={setEmailCB} placeholder="E-Mail" type="email" value={email} />
                    <Form.Label>E-Mail</Form.Label>
                </FloatingLabel>
                <Row>
                    <Col>
                        <FloatingLabel className="mb-3" label="API key">
                            <Form.Control
                                name="api_key"
                                placeholder="API key"
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
                        <Button onClick={doShowConfigureTotpModal} size="lg" type="button" variant="primary">
                            Configure two-factor
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

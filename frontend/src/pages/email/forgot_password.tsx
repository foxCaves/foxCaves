import React, { FormEvent, useCallback } from 'react';

import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { fetchAPIRaw } from '../../utils/api';
import { toast } from 'react-toastify';
import { useInputFieldSetter } from '../../utils/hooks';

export const ForgotPasswordPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');

    const submitForgotPasswordFormAsync = useCallback(async () => {
        try {
            await toast.promise(
                fetchAPIRaw('/api/v1/users/emails/request', {
                    method: 'POST',
                    data: {
                        username,
                        email,
                        action: 'forgotpwd',
                    },
                }),
                {
                    success: 'Forgot password E-Mail sent!',
                    pending: 'Sending forgot password E-Mail...',
                    error: {
                        render({ data }) {
                            const err = data as Error;
                            return `Error sending forgot password E-Mail: ${err.message}`;
                        },
                    },
                },
            );
            await fetchAPIRaw('/api/v1/users/emails/request', {
                method: 'POST',
                data: {
                    username,
                    email,
                    action: 'forgotpwd',
                },
            });
        } catch {}
    }, [username, email]);

    const submitForgotPasswordForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitForgotPasswordFormAsync();
        },
        [submitForgotPasswordFormAsync],
    );

    return (
        <>
            <h1>Forgot password?</h1>
            <br />
            <Form onSubmit={submitForgotPasswordForm}>
                <FloatingLabel className="mb-3" label="Username">
                    <Form.Control
                        name="username"
                        type="text"
                        placeholder="testuser"
                        required
                        value={username}
                        onChange={setUsernameCB}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        type="email"
                        placeholder="test@example.com"
                        required
                        value={email}
                        onChange={setEmailCB}
                    />
                </FloatingLabel>
                <Button variant="primary" type="submit" size="lg">
                    Send E-Mail
                </Button>
            </Form>
        </>
    );
};

import React, { FormEvent, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { fetchAPIRaw } from '../../utils/api';
import { useInputFieldSetter } from '../../utils/hooks';
import { logError } from '../../utils/misc';

export const ForgotPasswordPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');

    const submitForgotPasswordFormAsync = useCallback(async () => {
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
    }, [username, email]);

    const submitForgotPasswordForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitForgotPasswordFormAsync().catch(logError);
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
                        onChange={setUsernameCB}
                        placeholder="test user"
                        required
                        type="text"
                        value={username}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        onChange={setEmailCB}
                        placeholder="test@example.com"
                        required
                        type="email"
                        value={email}
                    />
                </FloatingLabel>
                <Button size="lg" type="submit" variant="primary">
                    Send E-Mail
                </Button>
            </Form>
        </>
    );
};

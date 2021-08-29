import React, { useCallback, useContext, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useInputFieldSetter } from '../../utils/hooks';
import { AppContext } from '../../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { fetchAPIRaw } from '../../utils/api';

export const ForgotPasswordPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');

    const { showAlert, closeAlert } = useContext(AppContext);

    const submitForgotPasswordFormAsync = useCallback(async () => {
        try {
            await fetchAPIRaw('/api/v1/users/emails/request', {
                method: 'POST',
                body: {
                    username,
                    email,
                    action: 'forgotpwd',
                },
            });
        } catch (err: any) {
            showAlert({
                id: 'forgot_password',
                contents: `Error sending forgot password E-Mail: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }
        showAlert({
            id: 'forgot_password',
            contents: 'Forgot password E-Mail sent!',
            variant: 'success',
            timeout: 2000,
        });
    }, [username, email, showAlert]);

    const submitForgotPasswordForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            closeAlert('forgot_password');
            submitForgotPasswordFormAsync();
        },
        [submitForgotPasswordFormAsync, closeAlert],
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

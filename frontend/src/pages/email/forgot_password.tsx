import React, { FormEvent, useCallback, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { CaptchaContainer } from '../../components/captcha';
import { AppContext } from '../../utils/context';
import { useInputFieldSetter } from '../../utils/hooks';
import { logError } from '../../utils/misc';

export const ForgotPasswordPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');
    const [captchaResponse, setCaptchaResponse] = useState('');
    const [captchaReset, setCaptchaReset] = useState(0);

    const submitForgotPasswordFormAsync = useCallback(async () => {
        if (!captchaResponse) {
            toast('CAPTCHA not completed', {
                type: 'error',
                autoClose: 5000,
            });

            return;
        }

        await toast.promise(
            apiAccessor.fetch('/api/v1/users/emails/request', {
                method: 'POST',
                data: {
                    username,
                    email,
                    action: 'forgot_password',
                    captchaResponse,
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
    }, [captchaResponse, username, email, apiAccessor]);

    const submitForgotPasswordForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitForgotPasswordFormAsync()
                .catch(logError)
                .finally(() => {
                    setCaptchaResponse('');
                    setCaptchaReset((prev) => prev + 1);
                });
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
                <CaptchaContainer
                    onParamChange={setCaptchaResponse}
                    page="forgot_password"
                    resetFactor={captchaReset}
                />
                <Button disabled={!captchaResponse} size="lg" type="submit" variant="primary">
                    Send E-Mail
                </Button>
            </Form>
        </>
    );
};

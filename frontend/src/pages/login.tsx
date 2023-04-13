import React, { FormEvent, useCallback, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CaptchaContainer } from '../components/captcha';
import { AppContext } from '../utils/context';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

export const LoginPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [remember, setRememberCB] = useCheckboxFieldSetter(false);
    const [captchaResponse, setCaptchaResponse] = useState('');
    const [captchaReset, setCaptchaReset] = useState(0);

    const { refreshUser, apiAccessor } = useContext(AppContext);

    const submitLoginFormAsync = useCallback(async () => {
        if (!captchaResponse) {
            toast('CAPTCHA not completed', {
                type: 'error',
                autoClose: 5000,
            });

            return;
        }

        try {
            await toast.promise(
                apiAccessor
                    .fetch('/api/v1/users/sessions', {
                        method: 'POST',
                        data: {
                            username,
                            password,
                            remember,
                            captchaResponse,
                        },
                    })
                    .then(refreshUser),
                {
                    success: 'Logged in!',
                    pending: 'Logging in...',
                    error: {
                        render({ data }) {
                            const err = data as Error;
                            return `Error logging in: ${err.message}`;
                        },
                    },
                },
            );
        } catch (error: unknown) {
            logError(error as Error);
            await refreshUser();
        } finally {
            setCaptchaResponse('');
            setCaptchaReset((prev) => prev + 1);
        }
    }, [captchaResponse, username, password, remember, refreshUser, apiAccessor]);

    const submitLoginForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitLoginFormAsync().catch(logError);
        },
        [submitLoginFormAsync],
    );

    return (
        <>
            <h1>Login</h1>
            <br />
            <Form onSubmit={submitLoginForm}>
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
                <FloatingLabel className="mb-3" label="Password">
                    <Form.Control
                        name="password"
                        onChange={setPasswordCB}
                        placeholder="password"
                        required
                        type="password"
                        value={password}
                    />
                </FloatingLabel>
                <CaptchaContainer onVerifyChanged={setCaptchaResponse} page="login" resetFactor={captchaReset} />
                <p>
                    <Link to="/email/forgot_password">Forgot password?</Link>
                </p>
                <Form.Group className="mb-3">
                    <Form.Check
                        checked={remember}
                        id="remember"
                        label="Remember me"
                        name="remember"
                        onChange={setRememberCB}
                        type="checkbox"
                        value="true"
                    />
                </Form.Group>
                <Button disabled={captchaResponse === ''} size="lg" type="submit" variant="primary">
                    Login
                </Button>
            </Form>
        </>
    );
};

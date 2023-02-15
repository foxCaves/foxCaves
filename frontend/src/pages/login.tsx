import React, { FormEvent, useCallback, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

export const LoginPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [remember, setRememberCB] = useCheckboxFieldSetter(false);

    const { refreshUser } = useContext(AppContext);

    const submitLoginFormAsync = useCallback(async () => {
        try {
            await toast.promise(
                fetchAPIRaw('/api/v1/users/sessions/login', {
                    method: 'POST',
                    data: {
                        username,
                        password,
                        remember,
                    },
                }),
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
        } catch {}

        await refreshUser();
    }, [username, password, remember, refreshUser]);

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
                <Button size="lg" type="submit" variant="primary">
                    Login
                </Button>
            </Form>
        </>
    );
};

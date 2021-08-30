import React, { useContext, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

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
                    body: {
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
            submitLoginFormAsync();
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
                        type="text"
                        placeholder="testuser"
                        required
                        value={username}
                        onChange={setUsernameCB}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Password">
                    <Form.Control
                        name="password"
                        type="password"
                        placeholder="password"
                        required
                        value={password}
                        onChange={setPasswordCB}
                    />
                </FloatingLabel>
                <p>
                    <Link to="/email/forgot_password">Forgot password?</Link>
                </p>
                <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        name="remember"
                        label="Remember me"
                        id="remember"
                        value="true"
                        checked={remember}
                        onChange={setRememberCB}
                    />
                </Form.Group>
                <Button variant="primary" type="submit" size="lg">
                    Login
                </Button>
            </Form>
        </>
    );
};

import React, { useContext, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { useCallback } from 'react';

export const LoginPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [remember, setRememberCB] = useCheckboxFieldSetter(false);

    const { showAlert, closeAlert, refreshUser } = useContext(AppContext);

    const submitLoginFormAsync = useCallback(async () => {
        try {
            await fetchAPIRaw('/api/v1/users/sessions/login', {
                method: 'POST',
                body: {
                    username,
                    password,
                    remember,
                },
            });
        } catch (err: any) {
            showAlert({
                id: 'login',
                contents: `Error logging in: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }
        await refreshUser();
        showAlert({
            id: 'login',
            contents: 'Logged in!',
            variant: 'success',
            timeout: 2000,
        });
    }, [username, password, remember, showAlert, refreshUser]);

    const submitLoginForm = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            closeAlert('login');
            submitLoginFormAsync();
        },
        [submitLoginFormAsync, closeAlert],
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

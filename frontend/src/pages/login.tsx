import React, { useContext, useState, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPIRaw } from '../utils/api';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);

    const { showAlert, closeAlert, refreshUser } = useContext(AppContext);

    async function submitLoginFormAsync() {
        try {
            await fetchAPIRaw('/api/v1/users/sessions/login', {
                method: 'POST',
                body: {
                    username,
                    password,
                    remember,
                },
            });
        } catch (err) {
            showAlert({
                id: 'login',
                contents: err.message,
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
    }

    function submitLoginForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        closeAlert('login');
        submitLoginFormAsync();
    }

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
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="Password">
                    <Form.Control
                        name="password"
                        type="password"
                        placeholder="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        onChange={(e) => setRemember(e.target.checked)}
                    />
                </Form.Group>
                <Button variant="primary" type="submit" size="lg">
                    Login
                </Button>
            </Form>
        </>
    );
};

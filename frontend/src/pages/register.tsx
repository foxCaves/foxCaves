import React, { FormEvent, useState, useContext } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPI } from '../utils/api';
import { AppContext } from '../utils/context';
import { Redirect } from 'react-router-dom';
import FloatingLabel from 'react-bootstrap/FloatingLabel';

export const RegistrationPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [email, setEmail] = useState('');
    const [agreetos, setAgreetos] = useState(false);
    const [registrationDone, setRegistrationDone] = useState(false);

    const { showAlert, closeAlert } = useContext(AppContext);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        closeAlert('register');
        event.preventDefault();

        if (password !== passwordConfirm) {
            showAlert({
                id: 'register',
                contents: 'Passwords do not match',
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }

        try {
            await fetchAPI('/api/v1/users', {
                method: 'POST',
                body: {
                    username,
                    password,
                    email,
                    agreetos,
                },
            });
        } catch (err: any) {
            showAlert({
                id: 'register',
                contents: `Error registering account: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }
        showAlert({
            id: 'register',
            contents:
                'Registration successful! Please check your E-Mail for activation instructions!',
            variant: 'success',
            timeout: 30000,
        });
        setRegistrationDone(true);
    }

    if (registrationDone) {
        return <Redirect to="/" />;
    }
    return (
        <>
            <h1>Register</h1>
            <br />
            <Form onSubmit={handleSubmit}>
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
                <FloatingLabel className="mb-3" label="Confirm password">
                    <Form.Control
                        name="passwordConfirm"
                        type="password"
                        placeholder="password"
                        required
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    />
                </FloatingLabel>
                <FloatingLabel className="mb-3" label="E-Mail">
                    <Form.Control
                        name="email"
                        type="email"
                        placeholder="test@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </FloatingLabel>
                <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        name="agreetos"
                        id="agreetos"
                        label="I agree to the Terms of Service and Privacy Policy"
                        value="true"
                        checked={agreetos}
                        onChange={(e) => setAgreetos(e.target.checked)}
                    />
                </Form.Group>
                <Button variant="primary" type="submit" size="lg">
                    Register
                </Button>
            </Form>
        </>
    );
};

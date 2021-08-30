import React, { FormEvent, useState, useCallback } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPI } from '../utils/api';
import { Redirect } from 'react-router-dom';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { toast } from 'react-toastify';

export const RegistrationPage: React.FC = () => {
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [passwordConfirm, setPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');
    const [agreetos, setAgreetosCB] = useCheckboxFieldSetter(false);
    const [registrationDone, setRegistrationDone] = useState(false);

    const handleSubmit = useCallback(
        async (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (password !== passwordConfirm) {
                toast('Passwords do not match', {
                    type: 'error',
                    autoClose: 5000,
                });
                return;
            }

            try {
                await toast.promise(
                    fetchAPI('/api/v1/users', {
                        method: 'POST',
                        data: {
                            username,
                            password,
                            email,
                            agreetos,
                        },
                    }),
                    {
                        success: 'Registration successful! Please check your E-Mail for activation instructions!',
                        pending: 'Registering account...',
                        error: {
                            render({ data }) {
                                const err = data as Error;
                                return `Error registering account: ${err.message}`;
                            },
                        },
                    },
                );
            } catch {
                return;
            }
            setRegistrationDone(true);
        },
        [username, password, passwordConfirm, email, agreetos],
    );

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
                <FloatingLabel className="mb-3" label="Confirm password">
                    <Form.Control
                        name="passwordConfirm"
                        type="password"
                        placeholder="password"
                        required
                        value={passwordConfirm}
                        onChange={setPasswordConfirmCB}
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
                <Form.Group className="mb-3">
                    <Form.Check
                        type="checkbox"
                        name="agreetos"
                        id="agreetos"
                        label="I agree to the Terms of Service and Privacy Policy"
                        value="true"
                        checked={agreetos}
                        onChange={setAgreetosCB}
                    />
                </Form.Group>
                <Button variant="primary" type="submit" size="lg">
                    Register
                </Button>
            </Form>
        </>
    );
};

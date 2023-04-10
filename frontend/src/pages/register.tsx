import React, { FormEvent, useCallback, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AppContext } from '../utils/context';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

export const RegistrationPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [passwordConfirm, setPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');
    const [agreeTos, setAgreeTosCallback] = useCheckboxFieldSetter(false);
    const [registrationDone, setRegistrationDone] = useState(false);

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (password !== passwordConfirm) {
                toast('Passwords do not match', {
                    type: 'error',
                    autoClose: 5000,
                });

                return;
            }

            toast
                .promise(
                    apiAccessor.fetch('/api/v1/users', {
                        method: 'POST',
                        data: {
                            username,
                            password,
                            email,
                            agreeTos,
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
                )
                .catch(logError)
                .finally(() => {
                    setRegistrationDone(true);
                });
        },
        [username, password, passwordConfirm, email, agreeTos, apiAccessor],
    );

    if (registrationDone) {
        return <Navigate to="/" />;
    }

    return (
        <>
            <h1>Register</h1>
            <br />
            <Form onSubmit={handleSubmit}>
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
                <FloatingLabel className="mb-3" label="Confirm password">
                    <Form.Control
                        name="passwordConfirm"
                        onChange={setPasswordConfirmCB}
                        placeholder="password"
                        required
                        type="password"
                        value={passwordConfirm}
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
                <Form.Group className="mb-3">
                    <Form.Check
                        checked={agreeTos}
                        id="agreeTos"
                        label="I agree to the Terms of Service and Privacy Policy"
                        name="agreeTos"
                        onChange={setAgreeTosCallback}
                        type="checkbox"
                        value="true"
                    />
                </Form.Group>
                <Button size="lg" type="submit" variant="primary">
                    Register
                </Button>
            </Form>
        </>
    );
};

import React, { FormEvent, useCallback, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CaptchaContainer } from '../components/captcha';
import { AppContext } from '../utils/context';
import { useCheckboxFieldSetter, useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

export const RegistrationPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const [username, setUsernameCB] = useInputFieldSetter('');
    const [password, setPasswordCB] = useInputFieldSetter('');
    const [passwordConfirm, setPasswordConfirmCB] = useInputFieldSetter('');
    const [email, setEmailCB] = useInputFieldSetter('');
    const [captchaResponse, setCaptchaResponse] = useState('');
    const [agreeTos, setAgreeTosCallback] = useCheckboxFieldSetter(false);
    const [registrationDone, setRegistrationDone] = useState(false);
    const [captchaReset, setCaptchaReset] = useState(0);

    const handleSubmit = useCallback(
        (event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (!captchaResponse) {
                toast('CAPTCHA not completed', {
                    type: 'error',
                    autoClose: 5000,
                });

                return;
            }

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
                            captchaResponse,
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
                .then(() => {
                    setRegistrationDone(true);
                })
                .catch(logError)
                .finally(() => {
                    setCaptchaResponse('');
                    setCaptchaReset((prev) => prev + 1);
                });
        },
        [username, password, passwordConfirm, email, agreeTos, apiAccessor, captchaResponse],
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
                <CaptchaContainer onVerifyChanged={setCaptchaResponse} page="registration" resetFactor={captchaReset} />
                <Form.Group className="mb-3">
                    <Form.Check
                        checked={agreeTos}
                        id="agreeTos"
                        label={
                            <>
                                I agree to the <Link to="/legal/terms_of_service">Terms of Service</Link> and{' '}
                                <Link to="/legal/privacy_policy">Privacy Policy</Link>
                            </>
                        }
                        name="agreeTos"
                        onChange={setAgreeTosCallback}
                        type="checkbox"
                        value="true"
                    />
                </Form.Group>
                <Button disabled={captchaResponse === ''} size="lg" type="submit" variant="primary">
                    Register
                </Button>
            </Form>
        </>
    );
};

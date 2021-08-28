import { FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FormBasePage } from './base';
import { fetchAPI } from '../utils/api';
import { AlertClass, AppContext, AppContextClass } from '../utils/context';
import { Redirect } from 'react-router-dom';
import FloatingLabel from 'react-bootstrap/FloatingLabel';

interface RegistrationPageState {
    username: string;
    password: string;
    confirm_password: string;
    email: string;
    agreetos: string;
    registration_done: boolean;
}

export class RegistrationPage extends FormBasePage<{}, RegistrationPageState> {
    static contextType = AppContext;
    context!: AppContextClass;

    constructor(props: {}) {
        super(props);
        this.state = {
            username: '',
            password: '',
            confirm_password: '',
            email: '',
            agreetos: '',
            registration_done: false,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    closeAlert() {
        this.context.closeAlert('register');
    }

    showAlert(alert: AlertClass) {
        this.closeAlert();
        this.context.showAlert(alert);
    }

    async handleSubmit(event: FormEvent<HTMLFormElement>) {
        this.closeAlert();
        event.preventDefault();

        if (this.state.password !== this.state.confirm_password) {
            this.showAlert({
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
                    username: this.state.username,
                    password: this.state.password,
                    email: this.state.email,
                    agreetos: this.state.agreetos,
                },
            });
        } catch (err) {
            this.showAlert({
                id: 'register',
                contents: err.message,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }
        this.showAlert({
            id: 'register',
            contents:
                'Registration successful! Please check your E-Mail for activation instructions!',
            variant: 'success',
            timeout: 30000,
        });
        this.setState({
            registration_done: true,
        });
    }

    render() {
        if (this.state.registration_done) {
            return <Redirect to="/" />;
        }
        return (
            <>
                <h1>Register</h1>
                <br />
                <Form onSubmit={this.handleSubmit}>
                    <FloatingLabel className="mb-3" label="Username">
                        <Form.Control
                            name="username"
                            type="text"
                            placeholder="testuser"
                            required
                            value={this.state.username}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="Password">
                        <Form.Control
                            name="password"
                            type="password"
                            placeholder="password"
                            required
                            value={this.state.password}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="Confirm password">
                        <Form.Control
                            name="confirm_password"
                            type="password"
                            placeholder="password"
                            required
                            value={this.state.confirm_password}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="E-Mail">
                        <Form.Control
                            name="email"
                            type="email"
                            placeholder="test@example.com"
                            required
                            value={this.state.email}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <Form.Group className="mb-3">
                        <Form.Check
                            type="checkbox"
                            name="agreetos"
                            id="agreetos"
                            label="I agree to the Terms of Service and Privacy Policy"
                            value="true"
                            checked={this.state.agreetos === 'true'}
                            onChange={this.handleChange}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit" size="lg">
                        Register
                    </Button>
                </Form>
            </>
        );
    }
}

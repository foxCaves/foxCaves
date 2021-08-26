import React, { ChangeEvent, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPI } from '../utils/api';
import { AlertClass, AppContext, AppContextClass } from '../utils/context';

interface LoginPageState {
    username: string;
    password: string;
    remember: string;
}

export class LoginPage extends React.Component<{}, LoginPageState> {
    static contextType = AppContext;
    context!: AppContextClass;

    constructor(props: {}) {
        super(props);
        this.state = {
            username: '',
            password: '',
            remember: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    closeLoginAlert() {
        this.context.closeAlert('login');
    }

    showLoginAlert(alert: AlertClass) {
        this.closeLoginAlert();
        this.context.showAlert(alert);
    }

    handleChange(event: ChangeEvent<HTMLInputElement>) {
        let value = event.target.value;
        if (event.target.type === 'checkbox' && !event.target.checked) {
            value = '';
        }
        this.setState({
            [event.target.name]: value,
        } as unknown as LoginPageState);
    }

    handleChecked(event: ChangeEvent<HTMLInputElement>) {
        this.setState({
            [event.target.name]: event.target.checked,
        } as unknown as LoginPageState);
    }

    async handleSubmit(event: FormEvent<HTMLFormElement>) {
        this.closeLoginAlert();
        event.preventDefault();
        try {
            await fetchAPI('/api/v1/users/sessions/login', {
                method: 'POST',
                body: new URLSearchParams(this.state),
            });
        } catch (err) {
            this.showLoginAlert({
                id: 'login',
                contents: err.message,
                variant: 'danger',
                timeout: 10000,
            });
            return;
        }
        await this.context.refreshUser();
    }

    render() {
        return (
            <div>
                <h1>Login</h1>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Group className="mb-3 form-floating">
                        <Form.Control name="username" type="text" placeholder="Username" value={this.state.username} onChange={this.handleChange} />
                        <Form.Label>Username</Form.Label>
                    </Form.Group>
                    <Form.Group className="mb-3 form-floating">
                        <Form.Control name="password" type="password" placeholder="Password" value={this.state.password} onChange={this.handleChange} />
                        <Form.Label>Password</Form.Label>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" name="remember" label="Remember me" value="true" checked={this.state.remember === 'true'} onChange={this.handleChange} />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Login
                    </Button>
                </Form>
            </div>
        );
    }
}

import React, { ChangeEvent, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { fetchAPI } from '../utils/api';
import { AppContext, AppContextClass } from '../utils/context';

interface LoginPageState {
    username: string;
    password: string;
    remember: boolean;
}

export class LoginPage extends React.Component<{}, LoginPageState> {
    static contextType = AppContext;
    context!: AppContextClass;

    constructor(props: {}) {
        super(props);
        this.state = {
            username: '',
            password: '',
            remember: false,
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({
            [event.target.name]: event.target.value,
        } as unknown as LoginPageState);
    }

    handleChecked(event: ChangeEvent<HTMLInputElement>) {
        this.setState({
            [event.target.name]: event.target.checked,
        } as unknown as LoginPageState);
    }

    async handleSubmit(event: FormEvent<HTMLFormElement>) {
        this.context.closeAlert();
        event.preventDefault();
        try {
            await fetchAPI('/api/v1/users/sessions/login', {
                method: 'POST',
                body: new URLSearchParams({
                    username: this.state.username,
                    password: this.state.password,
                    remember: this.state.remember ? 'true': 'false',
                }),
            });
        } catch (err) {
            this.context.showAlert(err.message, 'danger');
            return;
        }
        await this.context.refreshUser();
    }

    render() {
        return (
            <div>
                <h1>Login</h1>
                <Form onSubmit={this.handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control name="username" type="text" placeholder="Username" value={this.state.username} onChange={this.handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control name="password" type="password" placeholder="Password" value={this.state.password} onChange={this.handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Check type="checkbox" name="remember" label="Remember me" checked={this.state.remember} onChange={this.handleChange} />
                    </Form.Group>
                    <Button variant="primary" type="submit">
                        Login
                    </Button>
                </Form>
            </div>
        );
    }
}

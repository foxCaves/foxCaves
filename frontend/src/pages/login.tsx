import React, { ChangeEvent, FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import { fetchAPI } from '../utils/api';

interface LoginPageState {
    username: string;
    password: string;
}

export class LoginPage extends React.Component<{}, LoginPageState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            username: '',
            password: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event: ChangeEvent<HTMLInputElement>) {
        this.setState({
            [event.target.name]: event.target.value,
        } as unknown as LoginPageState);
    }

    async handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            await fetchAPI('/api/v1/users/sessions/login', {
                method: 'POST',
                body: new URLSearchParams(this.state),
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
                    <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <Form.Control name="username" type="text" placeholder="Username" value={this.state.username} onChange={this.handleChange} />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>Password</Form.Label>
                        <Form.Control name="password" type="text" placeholder="Password" value={this.state.password} onChange={this.handleChange} />
                    </Form.Group>
                    <input type="submit" value="Login" />
                </Form>
            </div>
        );
    }
}

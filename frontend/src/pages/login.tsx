import { ChangeEvent, FormEvent } from 'react';
import { BaseGuestOnlyPage } from './base';
import { fetchAPI } from '../utils/api';
import { AppContext, AppContextClass } from '../context';

interface LoginPageState {
    username: string;
    password: string;
}

export class LoginPage extends BaseGuestOnlyPage<{}, LoginPageState> {
    static contextType = AppContext;
    context!: AppContextClass;

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
        this.context.showAlert('Logged in, redirecting...', 'success');
        await this.context.refreshUser();
    }

    renderSub() {
        return (
            <div>
                <h1>Login</h1>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Username:
                        <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label>
                    <br />
                    <label>
                        Password:
                        <input type="password" name="password" value={this.state.password} onChange={this.handleChange} />
                    </label>
                    <br />
                    <input type="submit" value="Login" />
                </form>
            </div>
        );
    }
}

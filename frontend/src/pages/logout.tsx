import React from 'react';
import { fetchAPIRaw } from '../utils/api';
import { AppContext, AppContextClass } from '../utils/context';
import { Redirect } from 'react-router-dom';

interface LogoutState {
    logoutDone: boolean;
}

export class LogoutPage extends React.Component<{}, LogoutState> {
    static contextType = AppContext;
    context!: AppContextClass;

    constructor(props: {}) {
        super(props);
        this.state = {
            logoutDone: false,
        };
    }

    async componentDidMount() {
        if (this.state.logoutDone) {
            return;
        }

        await this.doLogout();
        await this.context.refreshUser();

        this.setState({
            logoutDone: true,
        });
    }

    async doLogout() {
        try {
            await fetchAPIRaw('/api/v1/users/sessions/logout', {
                method: 'POST',
            });
        } catch (err) {
            this.context.showAlert({
                id: 'logout',
                contents: `Error logging out: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }

        this.context.showAlert({
            id: 'logout',
            contents: 'Logged out!',
            variant: 'success',
            timeout: 5000,
        });
    }

    render() {
        if (this.state.logoutDone) {
            return <Redirect to="/" />;
        }

        return <h1>Logging out...</h1>;
    }
}

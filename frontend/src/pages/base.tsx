import { User } from "../models/user";
import React, { ReactNode } from 'react';
import { Redirect } from "react-router-dom";

export interface BasePageProps {
    user?: User;
    showAlert(message: string, variant: string): void;
    refreshUser(): Promise<void>;
}

export abstract class BasePage<T> extends React.Component<BasePageProps, T> {
    abstract renderSub(): ReactNode;
    render() {
        return this.renderSub();
    }
}

export abstract class BaseLoggedInPage<T> extends BasePage<T> {
    render() {
        if (this.props.user) {
            return super.render();
        }
        return (
            <Redirect to="/login" />
        );
    }
}

export abstract class BaseGuestOnlyPage<T> extends BasePage<T> {
    render() {
        if (!this.props.user) {
            return super.render();
        }
        return (
            <Redirect to="/" />
        );
    }
}

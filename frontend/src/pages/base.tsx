import React, { ReactNode } from 'react';
import { Redirect } from "react-router-dom";
import { AppContext, AppContextClass } from "../context";

export abstract class BasePage<R, T> extends React.Component<R, T> {
    static contextType = AppContext;
    context!: AppContextClass;

    abstract renderSub(): ReactNode;
    render() {
        return this.renderSub();
    }
}

export abstract class BaseLoggedInPage<R, T> extends BasePage<R, T> {
    render() {
        if (!this.context.userLoaded) {
            return null;
        }

        if (this.context.user) {
            return super.render();
        }
        return (
            <Redirect to="/login" />
        );
    }
}

export abstract class BaseGuestOnlyPage<R, T> extends BasePage<R, T> {
    render() {
        if (!this.context.user) {
            return super.render();
        }
        return (
            <Redirect to="/" />
        );
    }
}

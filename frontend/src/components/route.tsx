import { AppContext, AppContextClass } from '../utils/context';
import React, { ReactNode, useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';

import Dropdown from 'react-bootstrap/Dropdown';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';

export enum LoginState {
    LoggedIn = 1,
    LoggedOut = 2,
}

interface CustomRouteOptions {
    path: string;
    login?: LoginState;
}
export const CustomRoute: React.FC<CustomRouteOptions> = ({ path, login, children }) => {
    const ctx = useContext(AppContext);

    let component: ReactNode;
    if (ctx.userLoaded) {
        if (login === LoginState.LoggedIn && !ctx.user) {
            component = <Redirect to="/login" />;
        } else if (login === LoginState.LoggedOut && ctx.user) {
            component = <Redirect to="/" />;
        } else {
            component = children;
        }
    } else {
        component = <p>Loading...</p>;
    }

    return <Route path={path}>{component}</Route>;
};

function shouldRender(login: LoginState | undefined, ctx: AppContextClass) {
    if (!login) {
        return true;
    }
    if (!ctx.userLoaded) {
        return false;
    }

    if (login === LoginState.LoggedIn && !ctx.user) {
        return false;
    } else if (login === LoginState.LoggedOut && ctx.user) {
        return false;
    } else {
        return true;
    }
}

interface CustomNavLinkOptions {
    to: string;
    exact?: boolean;
    login?: LoginState;
}
export const CustomNavLink: React.FC<CustomNavLinkOptions> = ({ to, exact, login, children }) => {
    const ctx = useContext(AppContext);
    if (!shouldRender(login, ctx)) {
        return null;
    }
    return (
        <LinkContainer to={to} exact={exact}>
            <Nav.Link active={false}>{children}</Nav.Link>
        </LinkContainer>
    );
};

export const CustomDropDownItem: React.FC<CustomNavLinkOptions> = ({ to, exact, login, children }) => {
    const ctx = useContext(AppContext);
    if (!shouldRender(login, ctx)) {
        return null;
    }
    return (
        <LinkContainer to={to} exact={exact}>
            <Dropdown.Item>{children}</Dropdown.Item>
        </LinkContainer>
    );
};

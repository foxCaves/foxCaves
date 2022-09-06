import { AppContext, AppContextClass } from '../utils/context';
import { Navigate, Route } from 'react-router-dom';
import React, { ReactNode, useContext } from 'react';

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
    children?: React.ReactNode;
}
export const CustomRoute: React.FC<CustomRouteOptions> = ({ path, login, children }) => {
    const ctx = useContext(AppContext);

    let component: ReactNode;
    if (ctx.userLoaded) {
        if (login === LoginState.LoggedIn && !ctx.user) {
            component = <Navigate to="/login" />;
        } else if (login === LoginState.LoggedOut && ctx.user) {
            component = <Navigate to="/" />;
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
    children?: React.ReactNode;
}
export const CustomNavLink: React.FC<CustomNavLinkOptions> = ({ to, login, children }) => {
    const ctx = useContext(AppContext);
    if (!shouldRender(login, ctx)) {
        return null;
    }
    return (
        <LinkContainer to={to}>
            <Nav.Link active={false}>{children}</Nav.Link>
        </LinkContainer>
    );
};

export const CustomDropDownItem: React.FC<CustomNavLinkOptions> = ({ to, login, children }) => {
    const ctx = useContext(AppContext);
    if (!shouldRender(login, ctx)) {
        return null;
    }
    return (
        <LinkContainer to={to}>
            <Dropdown.Item>{children}</Dropdown.Item>
        </LinkContainer>
    );
};

import React, { ReactNode, useContext } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import { LinkContainer } from 'react-router-bootstrap';
import { Navigate } from 'react-router-dom';
import { AppContext, AppContextData } from '../utils/context';

export enum LoginState {
    LoggedIn = 1,
    LoggedOut = 2,
}

interface CustomRouteHandlerOptions {
    login?: LoginState;
    children?: React.ReactNode;
}
export const CustomRouteHandler: React.FC<CustomRouteHandlerOptions> = ({ login, children }) => {
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

    return component;
};

function shouldRender(login: LoginState | undefined, ctx: AppContextData) {
    if (!login) {
        return true;
    }

    if (!ctx.userLoaded) {
        return false;
    }

    if (login === LoginState.LoggedIn && !ctx.user) {
        return false;
    }

    if (login === LoginState.LoggedOut && ctx.user) {
        return false;
    }

    return true;
}

interface CustomNavLinkOptions {
    to: string;
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

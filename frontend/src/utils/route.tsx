import React, { ReactNode, useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AppContext, AppContextClass } from './context';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';

export enum LoginState {
    LoggedIn,
    LoggedOut,
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

    return (
        <Route path={path}>
            {component}
        </Route>
    );
}

function shouldRender(login: LoginState | undefined, ctx: AppContextClass) {
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

function makeNavLinkContainer(to: string, exact: boolean | undefined, children: ReactNode) {
    return <LinkContainer to={to} exact={exact}><Nav.Link active={false}>{children}</Nav.Link></LinkContainer>;
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
    return makeNavLinkContainer(to, exact, children);
}

export const CustomDropDownItem: React.FC<CustomNavLinkOptions> = ({ to, exact, login, children }) => {
    const ctx = useContext(AppContext);
    if (!shouldRender(login, ctx)) {
        return null;
    }
    return (
        <Dropdown.Item>{makeNavLinkContainer(to, exact, children)}</Dropdown.Item>
    );
}

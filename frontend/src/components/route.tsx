import React, { ReactElement, Suspense, useContext } from 'react';
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
    readonly login?: LoginState;
    readonly children?: ReactElement;
}
export const CustomRouteHandler: React.FC<CustomRouteHandlerOptions> = ({ login, children }) => {
    const { userLoaded, user } = useContext(AppContext);

    let component: ReactElement = <p>Loading...</p>;
    if (userLoaded) {
        if (login === LoginState.LoggedIn && !user) {
            component = <Navigate to="/login" />;
        } else if (login === LoginState.LoggedOut && user) {
            component = <Navigate to="/" />;
        } else if (children) {
            component = <RouteWrapper>{children}</RouteWrapper>;
        }
    }

    return component;
};

interface RouteWrapperOptions {
    readonly children?: ReactElement;
}
export const RouteWrapper: React.FC<RouteWrapperOptions> = ({ children }) => {
    return <Suspense fallback={<h3>Loading...</h3>}>{children}</Suspense>;
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
    readonly to: string;
    readonly login?: LoginState;
    readonly children?: ReactElement;
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

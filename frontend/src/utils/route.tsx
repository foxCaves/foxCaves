import React, { ReactNode, useContext } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { AppContext } from './context';

export enum LoginState {
    LoggedIn,
    LoggedOut,
    Any,
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

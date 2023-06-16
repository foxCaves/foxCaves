import './resources/app.css';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { lazily } from 'react-lazily';
import { LinkContainer } from 'react-router-bootstrap';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { LiveLoadingContainer } from './components/liveloading';
import { CustomDropDownItem, CustomNavLink, CustomRouteHandler, LoginState, RouteWrapper } from './components/route';
import { UserInactiveAlert } from './components/user_inactive_alert';
import { UserDetailsModel } from './models/user';
import { APIAccessor } from './utils/api';
import { AppContext, AppContextData } from './utils/context';
import { logError } from './utils/misc';

const { AccountPage } = lazily(async () => import('./pages/account'));
const { EmailCodePage } = lazily(async () => import('./pages/email/code'));
const { ForgotPasswordPage } = lazily(async () => import('./pages/email/forgot_password'));
const { FilesPage } = lazily(async () => import('./pages/files'));
const { HomePage } = lazily(async () => import('./pages/home'));
const { PrivacyPolicyPage } = lazily(async () => import('./pages/legal/privacy_policy'));
const { TermsOfServicePage } = lazily(async () => import('./pages/legal/terms_of_service'));
const { LinksPage } = lazily(async () => import('./pages/links'));
const { LiveDrawPage, LiveDrawRedirectPage } = lazily(async () => import('./pages/live_draw/page'));
const { LoginPage } = lazily(async () => import('./pages/login'));
const { LogoutPage } = lazily(async () => import('./pages/logout'));
const { RegistrationPage } = lazily(async () => import('./pages/register'));
const { ViewPage } = lazily(async () => import('./pages/view'));

const Routing: FC<{ user?: UserDetailsModel; userLoaded: boolean }> = ({ user, userLoaded }) => {
    return (
        <BrowserRouter future={{ v7_startTransition: true }}>
            <Navbar bg="primary" fixed="top" variant="dark">
                <Container>
                    <LinkContainer to="/">
                        <Navbar.Brand>foxCaves</Navbar.Brand>
                    </LinkContainer>
                    <Navbar.Toggle aria-controls="navbar-nav" />
                    <Navbar.Collapse id="navbar-nav">
                        <Nav className="me-auto">
                            <CustomNavLink login={LoginState.LoggedIn} to="/files">
                                <span>Files</span>
                            </CustomNavLink>
                            <CustomNavLink login={LoginState.LoggedIn} to="/links">
                                <span>Links</span>
                            </CustomNavLink>
                            <CustomNavLink login={LoginState.LoggedOut} to="/login">
                                <span>Login</span>
                            </CustomNavLink>
                            <CustomNavLink login={LoginState.LoggedOut} to="/register">
                                <span>Register</span>
                            </CustomNavLink>
                        </Nav>
                        <Nav>
                            <Dropdown as={Nav.Item}>
                                <Dropdown.Toggle as={Nav.Link}>
                                    {userLoaded ? <>Welcome, {user ? user.username : 'Guest'}!</> : <>Welcome!</>}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <CustomDropDownItem login={LoginState.LoggedIn} to="/account">
                                        <span>Account</span>
                                    </CustomDropDownItem>
                                    <CustomDropDownItem login={LoginState.LoggedIn} to="/logout">
                                        <span>Logout</span>
                                    </CustomDropDownItem>
                                    <CustomDropDownItem login={LoginState.LoggedOut} to="/login">
                                        <span>Login</span>
                                    </CustomDropDownItem>
                                    <CustomDropDownItem login={LoginState.LoggedOut} to="/register">
                                        <span>Register</span>
                                    </CustomDropDownItem>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container>
                <UserInactiveAlert />
                <Routes>
                    <Route
                        element={
                            <CustomRouteHandler login={LoginState.LoggedOut}>
                                <LoginPage />
                            </CustomRouteHandler>
                        }
                        path="/login"
                    />
                    <Route
                        element={
                            <CustomRouteHandler login={LoginState.LoggedOut}>
                                <RegistrationPage />
                            </CustomRouteHandler>
                        }
                        path="/register"
                    />
                    <Route
                        element={
                            <CustomRouteHandler login={LoginState.LoggedIn}>
                                <FilesPage />
                            </CustomRouteHandler>
                        }
                        path="/files"
                    />
                    <Route
                        element={
                            <CustomRouteHandler login={LoginState.LoggedIn}>
                                <LinksPage />
                            </CustomRouteHandler>
                        }
                        path="/links"
                    />
                    <Route
                        element={
                            <CustomRouteHandler login={LoginState.LoggedIn}>
                                <AccountPage />
                            </CustomRouteHandler>
                        }
                        path="/account"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <LogoutPage />
                            </RouteWrapper>
                        }
                        path="/logout"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <ViewPage />
                            </RouteWrapper>
                        }
                        path="/view/:id"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <LiveDrawPage />
                            </RouteWrapper>
                        }
                        path="/live_draw/:id/:sid"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <LiveDrawRedirectPage />
                            </RouteWrapper>
                        }
                        path="/live_draw/:id"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <ForgotPasswordPage />
                            </RouteWrapper>
                        }
                        path="/email/forgot_password"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <EmailCodePage />
                            </RouteWrapper>
                        }
                        path="/email/code/:code"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <PrivacyPolicyPage />
                            </RouteWrapper>
                        }
                        path="/legal/privacy_policy"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <TermsOfServicePage />
                            </RouteWrapper>
                        }
                        path="/legal/terms_of_service"
                    />
                    <Route
                        element={
                            <RouteWrapper>
                                <HomePage />
                            </RouteWrapper>
                        }
                        path="/"
                    />
                    <Route element={<h3>404 - Page not found</h3>} path="/*" />
                </Routes>
            </Container>
        </BrowserRouter>
    );
};

export const App: React.FC = () => {
    const [user, setUser] = useState<UserDetailsModel | undefined>(undefined);
    const [userLoaded, setUserLoaded] = useState(false);
    const [userLoadStarted, setUserLoadStarted] = useState(false);
    const apiAccessor: APIAccessor = useMemo(() => {
        return new APIAccessor();
    }, []);

    const refreshUser = useCallback(async () => {
        const newUser = await UserDetailsModel.getById('self', apiAccessor);
        setUser(newUser);
        setUserLoaded(true);
    }, [setUser, setUserLoaded, apiAccessor]);

    const context: AppContextData = useMemo(
        () => ({
            user,
            setUser,
            userLoaded,
            refreshUser,
            apiAccessor,
        }),
        [refreshUser, user, userLoaded, apiAccessor],
    );

    useEffect(() => {
        if (userLoadStarted || userLoaded) {
            return;
        }

        setUserLoadStarted(true);
        refreshUser().then(() => {
            setUserLoadStarted(false);
        }, logError);
    }, [userLoadStarted, userLoaded, refreshUser]);

    return (
        <AppContext.Provider value={context}>
            <LiveLoadingContainer>
                <Routing user={user} userLoaded={userLoaded} />
                <ToastContainer position="bottom-right" theme="colored" />
            </LiveLoadingContainer>
        </AppContext.Provider>
    );
};

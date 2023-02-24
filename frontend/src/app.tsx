import './resources/app.css';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { LinkContainer } from 'react-router-bootstrap';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { LiveLoadingContainer } from './components/liveloading';
import { CustomDropDownItem, CustomNavLink, CustomRouteHandler, LoginState } from './components/route';
import { UserInactiveAlert } from './components/user_inactive_alert';
import { UserDetailsModel } from './models/user';
import { AccountPage } from './pages/account';
import { EmailCodePage } from './pages/email/code';
import { ForgotPasswordPage } from './pages/email/forgot_password';
import { FilesPage } from './pages/files';
import { HomePage } from './pages/home';
import { LinksPage } from './pages/links';
import { LiveDrawPage, LiveDrawRedirectPage } from './pages/livedraw/page';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { RegistrationPage } from './pages/register';
import { ViewPage } from './pages/view';
import { AppContext, AppContextData } from './utils/context';
import { logError } from './utils/misc';

const Routing: FC<{ user?: UserDetailsModel }> = ({ user }) => {
    return (
        <Router>
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
                                    Welcome, {user ? user.username : 'Guest'}!
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
                    <Route element={<LogoutPage />} path="/logout" />
                    <Route element={<ViewPage />} path="/view/:id" />
                    <Route element={<LiveDrawPage />} path="/livedraw/:id/:sid" />
                    <Route element={<LiveDrawRedirectPage />} path="/livedraw/:id" />
                    <Route element={<ForgotPasswordPage />} path="/email/forgot_password" />
                    <Route element={<EmailCodePage />} path="/email/code/:code" />
                    <Route element={<HomePage />} path="/" />
                    <Route element={<h3>404 - Page not found</h3>} path="/*" />
                </Routes>
            </Container>
        </Router>
    );
};

export const App: React.FC = () => {
    const [user, setUser] = useState<UserDetailsModel | undefined>(undefined);
    const [userLoaded, setUserLoaded] = useState(false);
    const [userLoadStarted, setUserLoadStarted] = useState(false);

    const refreshUser = useCallback(async () => {
        const newUser = await UserDetailsModel.getById('self');
        setUser(newUser);
        setUserLoaded(true);
    }, [setUser, setUserLoaded]);

    const context: AppContextData = useMemo(
        () => ({
            user,
            setUser,
            userLoaded,
            refreshUser,
        }),
        [refreshUser, user, userLoaded],
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
                <Routing user={user} />
                <ToastContainer position="bottom-right" theme="colored" />
            </LiveLoadingContainer>
        </AppContext.Provider>
    );
};

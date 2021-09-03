import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { RegistrationPage } from './pages/register';
import { FilesPage } from './pages/files';
import { LinksPage } from './pages/links';
import { AccountPage } from './pages/account';
import { ViewPage } from './pages/view';
import React, { useState, useEffect, useCallback } from 'react';
import { UserDetailsModel } from './models/user';
import { AppContext, AppContextClass } from './utils/context';
import { LoginState, CustomRoute, CustomNavLink, CustomDropDownItem } from './components/route';
import { LinkContainer } from 'react-router-bootstrap';
import { UserInactiveAlert } from './components/user_inactive_alert';
import { ForgotPasswordPage } from './pages/email/forgot_password';
import { EmailCodePage } from './pages/email/code';
import { LiveLoadingContainer } from './components/liveloading';

import './resources/app.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-aspect-ratio/aspect-ratio.css';
import { ToastContainer } from 'react-toastify';

export const App: React.FC = () => {
    const [user, setUser] = useState<UserDetailsModel | undefined>(undefined);
    const [userLoaded, setUserLoaded] = useState(false);
    const [userLoadStarted, setUserLoadStarted] = useState(false);

    const refreshUser = useCallback(async () => {
        const user = await UserDetailsModel.getById('self');
        setUser(user);
        setUserLoaded(true);
    }, []);

    const context: AppContextClass = {
        user,
        setUser,
        userLoaded,
        refreshUser,
    };

    useEffect(() => {
        if (userLoadStarted || userLoaded) {
            return;
        }
        setUserLoadStarted(true);
        refreshUser().then(() => setUserLoadStarted(false));
    }, [userLoadStarted, userLoaded, refreshUser]);

    return (
        <AppContext.Provider value={context}>
            <LiveLoadingContainer>
                <Router>
                    <Navbar variant="dark" bg="primary" fixed="top">
                        <Container>
                            <LinkContainer to="/" exact>
                                <Navbar.Brand>foxCaves</Navbar.Brand>
                            </LinkContainer>
                            <Navbar.Toggle aria-controls="navbar-nav" />
                            <Navbar.Collapse id="navbar-nav">
                                <Nav className="me-auto">
                                    <CustomNavLink login={LoginState.LoggedIn} to="/files">
                                        Files
                                    </CustomNavLink>
                                    <CustomNavLink login={LoginState.LoggedIn} to="/links">
                                        Links
                                    </CustomNavLink>
                                    <CustomNavLink login={LoginState.LoggedOut} to="/login">
                                        Login
                                    </CustomNavLink>
                                    <CustomNavLink login={LoginState.LoggedOut} to="/register">
                                        Register
                                    </CustomNavLink>
                                </Nav>
                                <Nav>
                                    <Dropdown as={Nav.Item}>
                                        <Dropdown.Toggle as={Nav.Link}>
                                            Welcome, {user ? user.username : 'Guest'}!
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            <CustomDropDownItem login={LoginState.LoggedIn} to="/account">
                                                Account
                                            </CustomDropDownItem>
                                            <CustomDropDownItem login={LoginState.LoggedIn} to="/logout">
                                                Logout
                                            </CustomDropDownItem>
                                            <CustomDropDownItem login={LoginState.LoggedOut} to="/login">
                                                Login
                                            </CustomDropDownItem>
                                            <CustomDropDownItem login={LoginState.LoggedOut} to="/register">
                                                Register
                                            </CustomDropDownItem>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Nav>
                            </Navbar.Collapse>
                        </Container>
                    </Navbar>
                    <Container>
                        <UserInactiveAlert />
                        <Switch>
                            <CustomRoute path="/login" login={LoginState.LoggedOut}>
                                <LoginPage />
                            </CustomRoute>
                            <CustomRoute path="/register" login={LoginState.LoggedOut}>
                                <RegistrationPage />
                            </CustomRoute>
                            <CustomRoute path="/files" login={LoginState.LoggedIn}>
                                <FilesPage />
                            </CustomRoute>
                            <CustomRoute path="/links" login={LoginState.LoggedIn}>
                                <LinksPage />
                            </CustomRoute>
                            <CustomRoute path="/account" login={LoginState.LoggedIn}>
                                <AccountPage />
                            </CustomRoute>
                            <Route path="/logout">
                                <LogoutPage />
                            </Route>
                            <Route path="/view/:id">
                                <ViewPage />
                            </Route>
                            <Route path="/email/forgot_password">
                                <ForgotPasswordPage />
                            </Route>
                            <Route path="/email/code/:code">
                                <EmailCodePage />
                            </Route>
                            <Route path="/" exact>
                                <HomePage />
                            </Route>
                            <Route path="/">
                                <h3>404 - Page not found</h3>
                            </Route>
                        </Switch>
                    </Container>
                </Router>
                <ToastContainer theme="colored" position="bottom-right" />
            </LiveLoadingContainer>
        </AppContext.Provider>
    );
};

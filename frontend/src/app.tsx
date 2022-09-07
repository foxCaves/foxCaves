import './resources/app.css';

import { AppContext, AppContextClass } from './utils/context';
import { CustomDropDownItem, CustomNavLink, CustomRouteHandler, LoginState } from './components/route';
import { LiveDrawPage, LiveDrawRedirectPage } from './pages/livedraw/page';
import React, { useCallback, useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AccountPage } from './pages/account';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import { EmailCodePage } from './pages/email/code';
import { FilesPage } from './pages/files';
import { ForgotPasswordPage } from './pages/email/forgot_password';
import { HomePage } from './pages/home';
import { LinkContainer } from 'react-router-bootstrap';
import { LinksPage } from './pages/links';
import { LiveLoadingContainer } from './components/liveloading';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { RegistrationPage } from './pages/register';
import { ToastContainer } from 'react-toastify';
import { UserDetailsModel } from './models/user';
import { UserInactiveAlert } from './components/user_inactive_alert';
import { ViewPage } from './pages/view';

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
                            <LinkContainer to="/">
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
                        <Routes>
                            <Route path="/login" element={
                                <CustomRouteHandler login={LoginState.LoggedOut}>
                                    <LoginPage />
                                </CustomRouteHandler>
                            }></Route>
                            <Route path="/register" element={
                                <CustomRouteHandler login={LoginState.LoggedOut}>
                                    <RegistrationPage />
                                </CustomRouteHandler>
                            }></Route>
                            <Route path="/files" element={
                                <CustomRouteHandler login={LoginState.LoggedIn}>
                                    <FilesPage />
                                </CustomRouteHandler>
                            }></Route>
                            <Route path="/links" element={
                                <CustomRouteHandler login={LoginState.LoggedIn}>
                                    <LinksPage />
                                </CustomRouteHandler>
                            }></Route>
                            <Route path="/account" element={
                                <CustomRouteHandler login={LoginState.LoggedIn}>
                                    <AccountPage />
                                </CustomRouteHandler>
                            }></Route>
                            <Route path="/logout" element={
                                <LogoutPage />
                            }></Route>
                            <Route path="/view/:id" element={
                                <ViewPage />
                            }></Route>
                            <Route path="/livedraw/:id/:sid" element={
                                <LiveDrawPage />
                            }></Route>
                            <Route path="/livedraw/:id" element={
                                <LiveDrawRedirectPage />
                            }></Route>
                            <Route path="/email/forgot_password" element={
                                <ForgotPasswordPage />
                            }></Route>
                            <Route path="/email/code/:code" element={
                                <EmailCodePage />
                            }></Route>
                            <Route path="/" element={
                                <HomePage />
                            }></Route>
                            <Route path="/*" element={
                                <h3>404 - Page not found</h3>
                            }></Route>
                        </Routes>
                    </Container>
                </Router>
                <ToastContainer theme="colored" position="bottom-right" />
            </LiveLoadingContainer>
        </AppContext.Provider>
    );
};

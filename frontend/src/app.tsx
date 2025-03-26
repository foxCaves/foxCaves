import './resources/app.css';

import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Dropdown from 'react-bootstrap/Dropdown';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ToastContainer } from 'react-toastify';
import { LinkContainer } from './components/link_container';
import { LiveLoadingContainer } from './components/liveloading';
import { CustomDropDownItem, CustomNavLink, CustomRouteHandler, LoginState } from './components/route';
import { UserEmailValidAlert } from './components/user_email_valid_alert';
import { UserNotApprovedAlert } from './components/user_not_approved_alert';
import { UserDetailsModel } from './models/user';
import { AccountPage } from './pages/account';
import { EmailCodePage } from './pages/email/code';
import { ForgotPasswordPage } from './pages/email/forgot_password';
import { FilesPage } from './pages/files';
import { HomePage } from './pages/home';
import { PrivacyPolicyPage } from './pages/legal/privacy_policy';
import { TermsOfServicePage } from './pages/legal/terms_of_service';
import { LinksPage } from './pages/links';
import { LiveDrawPage, LiveDrawRedirectPage } from './pages/live_draw/page';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { RegistrationPage } from './pages/register';
import { ViewPage } from './pages/view';
import { APIAccessor } from './utils/api';
import { AppContext, AppContextData } from './utils/context';
import { logError } from './utils/misc';

const Routing: FC<{ readonly user?: UserDetailsModel; readonly userLoaded: boolean }> = ({ user, userLoaded }) => {
    return (
        <BrowserRouter>
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
                <UserEmailValidAlert />
                <UserNotApprovedAlert />
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
                    <Route element={<LiveDrawPage />} path="/live_draw/:id/:sid" />
                    <Route element={<LiveDrawRedirectPage />} path="/live_draw/:id" />
                    <Route element={<ForgotPasswordPage />} path="/email/forgot_password" />
                    <Route element={<EmailCodePage />} path="/email/code/:code" />
                    <Route element={<PrivacyPolicyPage />} path="/legal/privacy_policy" />
                    <Route element={<TermsOfServicePage />} path="/legal/terms_of_service" />
                    <Route element={<HomePage />} path="/" />
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

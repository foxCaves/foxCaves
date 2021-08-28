import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import Alert from 'react-bootstrap/Alert';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { LogoutPage } from './pages/logout';
import { RegistrationPage } from './pages/register';
import { FilesPage } from './pages/files';
import { LinksPage } from './pages/links';
import { AccountPage } from './pages/account';
import React, { useContext, useState, useEffect } from 'react';
import { UserModel } from './models/user';
import { AlertClass, AppContext, AppContextClass } from './utils/context';
import {
    LoginState,
    CustomRoute,
    CustomNavLink,
    CustomDropDownItem,
} from './utils/route';
import { LinkContainer } from 'react-router-bootstrap';

import './app.css';
import { useCallback } from 'react';

const AlertView: React.FC<{ alert: AlertClass }> = ({ alert }) => {
    const closeAlert = useContext(AppContext).closeAlert;
    const id = alert.id;

    const closeSelf = useCallback(() => {
        closeAlert(id);
    }, [closeAlert, id]);

    return (
        <Alert show variant={alert.variant} onClose={closeSelf} dismissible>
            {alert.contents}
        </Alert>
    );
};

export const App: React.FC<{}> = () => {
    const [user, setUser] = useState<UserModel | undefined>(undefined);
    const [userLoaded, setUserLoaded] = useState(false);
    const [userLoadStarted, setUserLoadStarted] = useState(false);
    const [alerts, setAlerts] = useState<AlertClass[]>([]);

    async function refreshUser() {
        const user = await UserModel.getById('self', true);
        setUser(user);
        setUserLoaded(true);
    }

    function showAlert(alert: AlertClass) {
        let newAlerts = [...alerts];
        closeAlert(alert.id);
        newAlerts.push(alert);
        if (alert.timeout > 0) {
            alert.__timeout = setTimeout(() => {
                closeAlert(alert.id);
            }, alert.timeout);
        }
        setAlerts(newAlerts);
    }

    function closeAlert(id: string) {
        let newAlerts = [...alerts];
        const oldAlert = newAlerts.find((a) => a.id === id);
        if (oldAlert) {
            newAlerts = newAlerts.filter((a) => a.id !== id);
            if (oldAlert.__timeout) {
                clearTimeout(oldAlert.__timeout);
                oldAlert.__timeout = undefined;
            }
        }
        setAlerts(newAlerts);
    }

    const context: AppContextClass = {
        user,
        userLoaded,
        showAlert,
        refreshUser,
        closeAlert,
    };

    useEffect(() => {
        if (userLoadStarted || userLoaded) {
            return;
        }
        setUserLoadStarted(true);
        refreshUser();
        setUserLoadStarted(false);
    });

    return (
        <AppContext.Provider value={context}>
            <Router>
                <Navbar variant="dark" bg="primary" fixed="top">
                    <Container>
                        <LinkContainer to="/" exact>
                            <Navbar.Brand>foxCaves</Navbar.Brand>
                        </LinkContainer>
                        <Navbar.Toggle aria-controls="navbar-nav" />
                        <Navbar.Collapse id="navbar-nav">
                            <Nav className="me-auto">
                                <CustomNavLink
                                    login={LoginState.LoggedIn}
                                    to="/files"
                                >
                                    Files
                                </CustomNavLink>
                                <CustomNavLink
                                    login={LoginState.LoggedIn}
                                    to="/links"
                                >
                                    Links
                                </CustomNavLink>
                                <CustomNavLink
                                    login={LoginState.LoggedOut}
                                    to="/login"
                                >
                                    Login
                                </CustomNavLink>
                                <CustomNavLink
                                    login={LoginState.LoggedOut}
                                    to="/register"
                                >
                                    Register
                                </CustomNavLink>
                            </Nav>
                            <Nav>
                                <Dropdown as={Nav.Item}>
                                    <Dropdown.Toggle as={Nav.Link}>
                                        Welcome,{' '}
                                        {user ? user.username : 'Guest'}!
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <CustomDropDownItem
                                            login={LoginState.LoggedIn}
                                            to="/account"
                                        >
                                            Account
                                        </CustomDropDownItem>
                                        <CustomDropDownItem
                                            login={LoginState.LoggedIn}
                                            to="/logout"
                                        >
                                            Logout
                                        </CustomDropDownItem>
                                        <CustomDropDownItem
                                            login={LoginState.LoggedOut}
                                            to="/login"
                                        >
                                            Login
                                        </CustomDropDownItem>
                                        <CustomDropDownItem
                                            login={LoginState.LoggedOut}
                                            to="/register"
                                        >
                                            Register
                                        </CustomDropDownItem>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </Nav>
                        </Navbar.Collapse>
                    </Container>
                </Navbar>
                <Container>
                    {alerts.map((alert) => (
                        <AlertView alert={alert} key={alert.id} />
                    ))}
                    <Switch>
                        <CustomRoute path="/login" login={LoginState.LoggedOut}>
                            <LoginPage />
                        </CustomRoute>
                        <CustomRoute
                            path="/register"
                            login={LoginState.LoggedOut}
                        >
                            <RegistrationPage />
                        </CustomRoute>
                        <CustomRoute path="/files" login={LoginState.LoggedIn}>
                            <FilesPage />
                        </CustomRoute>
                        <CustomRoute path="/links" login={LoginState.LoggedIn}>
                            <LinksPage />
                        </CustomRoute>
                        <CustomRoute
                            path="/account"
                            login={LoginState.LoggedIn}
                        >
                            <AccountPage />
                        </CustomRoute>
                        <Route path="/logout">
                            <LogoutPage />
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
        </AppContext.Provider>
    );
};

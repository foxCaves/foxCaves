import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Dropdown from 'react-bootstrap/Dropdown';
import Alert from 'react-bootstrap/Alert';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { RegistrationPage } from './pages/register';
import { FilesPage } from './pages/files';
import { LinksPage } from './pages/links';
import { AccountPage } from './pages/account';
import React from 'react';
import { User } from './models/user';
import { AppContext, AppContextClass } from './utils/context';
import { LoginState, CustomRoute, CustomNavLink, CustomDropDownItem } from './utils/route';

interface AppState {
    user?: User;
    userLoaded: boolean;
    showAlert: boolean;
    alertMessage: string;
    alertVariant: string;
}

export class App extends React.Component<{}, AppState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            showAlert: false,
            alertMessage: '',
            alertVariant: '',
            userLoaded: false,
        };
        this.closeAlert = this.closeAlert.bind(this);
        this.showAlert = this.showAlert.bind(this);
        this.refreshUser = this.refreshUser.bind(this);
    }

    async componentDidMount() {
        await this.refreshUser();
    }

    async refreshUser() {
        const user = await User.getById('self', true);
        this.setState({
            user,
            userLoaded: true,
        });
    }

    showAlert(message: string, variant: string) {
        this.setState({
            showAlert: true,
            alertMessage: message,
            alertVariant: variant,
        });
    }

    closeAlert() {
        this.setState({
            showAlert: false
        });
    }

    render() {
        const context: AppContextClass = {
            user: this.state.user,
            userLoaded: this.state.userLoaded,
            showAlert: this.showAlert,
            refreshUser: this.refreshUser,
            closeAlert: this.closeAlert,
        };

        return (
            <AppContext.Provider value={context}>
                <Router>
                    <Container>
                        <Navbar variant="dark" bg="dark">
                            <Container>
                                <Navbar.Brand>foxCaves</Navbar.Brand>
                                <Navbar.Toggle aria-controls="navbar-nav" />
                                <Navbar.Collapse id="navbar-nav">
                                    <Nav className="me-auto">
                                        <CustomNavLink to="/" exact>Home</CustomNavLink>
                                        <CustomNavLink login={LoginState.LoggedIn} to="/files">Files</CustomNavLink>
                                        <CustomNavLink login={LoginState.LoggedIn} to="/links">Links</CustomNavLink>
                                        <CustomNavLink login={LoginState.LoggedOut} to="/login">Login</CustomNavLink>
                                        <CustomNavLink login={LoginState.LoggedOut} to="/register">Register</CustomNavLink>
                                    </Nav>
                                    <Nav>
                                        <Dropdown as={Nav.Item}>
                                            <Dropdown.Toggle as={Nav.Link}>Welcome, {this.state.user ? this.state.user.username : 'Guest'}!</Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <CustomDropDownItem login={LoginState.LoggedIn} to="/account">Account</CustomDropDownItem>
                                                <CustomDropDownItem login={LoginState.LoggedIn} to="/logout">Logout</CustomDropDownItem>
                                                <CustomDropDownItem login={LoginState.LoggedOut} to="/login">Login</CustomDropDownItem>
                                                <CustomDropDownItem login={LoginState.LoggedOut} to="/register">Register</CustomDropDownItem>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </Nav>
                                </Navbar.Collapse>
                            </Container>
                        </Navbar>
                        <br />
                        <Alert show={this.state.showAlert} variant={this.state.alertVariant} onClose={this.closeAlert} dismissible>
                            {this.state.alertMessage}
                        </Alert>
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
    }
}

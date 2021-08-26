import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
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
import { LoginState, CustomRoute } from './utils/route';

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
        let nav = undefined;
        if (this.state.userLoaded) {
            if (this.state.user) {
                nav = (<>
                    <LinkContainer to="/" exact><Nav.Link>Home</Nav.Link></LinkContainer>
                    <LinkContainer to="/files"><Nav.Link>Files</Nav.Link></LinkContainer>
                    <LinkContainer to="/links"><Nav.Link>Links</Nav.Link></LinkContainer>
                    <LinkContainer to="/account"><Nav.Link>Account</Nav.Link></LinkContainer>
                </>);
            } else {
                nav = (<>
                    <LinkContainer to="/" exact><Nav.Link>Home</Nav.Link></LinkContainer>
                    <LinkContainer to="/login"><Nav.Link>Login</Nav.Link></LinkContainer>
                    <LinkContainer to="/register"><Nav.Link>Login</Nav.Link></LinkContainer>
                </>);
            }
        } else {
            nav = (<>
                <LinkContainer to="/" exact><Nav.Link>Home</Nav.Link></LinkContainer>
            </>);
        }

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
                        <Navbar bg="light">
                            <Container>
                                <Navbar.Brand>foxCaves</Navbar.Brand>
                                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                                <Navbar.Collapse id="basic-navbar-nav">
                                    <Nav className="me-auto">
                                        {nav}
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

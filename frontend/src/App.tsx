import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Alert from 'react-bootstrap/Alert';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { FilesPage } from './pages/files';
import React from 'react';
import { User } from './models/user';
import { AppContext, AppContextClass } from './context';

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
                    <LinkContainer to="/"><Nav.Link>Home</Nav.Link></LinkContainer>
                    <LinkContainer to="/files"><Nav.Link>Files</Nav.Link></LinkContainer>
                </>);
            } else {
                nav = (<>
                    <LinkContainer to="/"><Nav.Link>Home</Nav.Link></LinkContainer>
                    <LinkContainer to="/login"><Nav.Link>Login</Nav.Link></LinkContainer>
                </>);
            }
        } else {
            nav = (<>
                <LinkContainer to="/"><Nav.Link>Home</Nav.Link></LinkContainer>
            </>);
        }

        const context: AppContextClass = {
            user: this.state.user,
            userLoaded: this.state.userLoaded,
            showAlert: this.showAlert,
            refreshUser: this.refreshUser,
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
                            <Route path="/login">
                                <LoginPage />
                            </Route>
                            <Route path="/files">
                                <FilesPage />
                            </Route>
                            <Route path="/">
                                <HomePage />
                            </Route>
                        </Switch>
                    </Container>
                </Router>
            </AppContext.Provider>
        );
    }
}

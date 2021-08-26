import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Alert from 'react-bootstrap/Alert';
import { Home } from './pages/home';
import { Login } from './pages/login';
import React from 'react';
import { User } from './models/user';

interface AppState {
    user?: User;
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
        return (
            <Router>
                <Container>
                    <Navbar bg="light">
                        <Container>
                            <Navbar.Brand>foxCaves</Navbar.Brand>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                <Nav className="me-auto">
                                    <LinkContainer to="/"><Nav.Link>Home</Nav.Link></LinkContainer>
                                    <LinkContainer to="/login"><Nav.Link>Login</Nav.Link></LinkContainer>
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
                            <Login refreshUser={this.refreshUser} user={this.state.user} showAlert={this.showAlert} />
                        </Route>
                        <Route path="/">
                            <Home refreshUser={this.refreshUser} user={this.state.user} showAlert={this.showAlert} />
                        </Route>
                    </Switch>
                </Container>
            </Router>
        );
    }
}

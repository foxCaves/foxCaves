import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { LinkContainer } from 'react-router-bootstrap';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import { Home } from './pages/home';
import { Login } from './pages/login';
import React from 'react';

export class App extends React.Component {
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
          <Switch>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </Container>
      </Router>
    );
  }
}

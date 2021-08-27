import { FormEvent } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { FormBasePage } from "./base";
import { fetchAPI } from "../utils/api";
import { AlertClass, AppContext, AppContextClass } from "../utils/context";
import { Redirect } from "react-router-dom";

interface RegistrationPageState {
  username: string;
  password: string;
  confirm_password: string;
  email: string;
  agreetos: string;
  registration_done: boolean;
}

export class RegistrationPage extends FormBasePage<{}, RegistrationPageState> {
  static contextType = AppContext;
  context!: AppContextClass;

  constructor(props: {}) {
    super(props);
    this.state = {
      username: "",
      password: "",
      confirm_password: "",
      email: "",
      agreetos: "",
      registration_done: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  closeRegistrationAlert() {
    this.context.closeAlert("register");
  }

  showRegistrationAlert(alert: AlertClass) {
    this.closeRegistrationAlert();
    this.context.showAlert(alert);
  }

  async handleSubmit(event: FormEvent<HTMLFormElement>) {
    this.closeRegistrationAlert();
    event.preventDefault();

    if (this.state.password !== this.state.confirm_password) {
      this.showRegistrationAlert({
        id: "register",
        contents: "Passwords do not match",
        variant: "danger",
        timeout: 5000,
      });
      return;
    }

    try {
      await fetchAPI("/api/v1/users", {
        method: "POST",
        body: new URLSearchParams({
          username: this.state.username,
          password: this.state.password,
          email: this.state.email,
          agreetos: this.state.agreetos,
        }),
      });
    } catch (err) {
      this.showRegistrationAlert({
        id: "register",
        contents: err.message,
        variant: "danger",
        timeout: 5000,
      });
      return;
    }
    this.showRegistrationAlert({
      id: "register",
      contents:
        "Registration successful! Please check your E-Mail for activation instructions!",
      variant: "success",
      timeout: 30000,
    });
    this.setState({
      registration_done: true,
    });
  }

  render() {
    if (this.state.registration_done) {
      return <Redirect to="/" />;
    }
    return (
      <>
        <h1>Register</h1>
        <br />
        <Form onSubmit={this.handleSubmit}>
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              name="username"
              type="text"
              placeholder="Username"
              required
              value={this.state.username}
              onChange={this.handleChange}
            />
            <Form.Label>Username</Form.Label>
          </Form.Group>
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              name="password"
              type="password"
              placeholder="Password"
              required
              value={this.state.password}
              onChange={this.handleChange}
            />
            <Form.Label>Password</Form.Label>
          </Form.Group>
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              name="confirm_password"
              type="password"
              placeholder="Password"
              required
              value={this.state.confirm_password}
              onChange={this.handleChange}
            />
            <Form.Label>Confirm password</Form.Label>
          </Form.Group>
          <Form.Group className="mb-3 form-floating">
            <Form.Control
              name="email"
              type="email"
              placeholder="E-Mail"
              required
              value={this.state.email}
              onChange={this.handleChange}
            />
            <Form.Label>E-Mail</Form.Label>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="agreetos"
              label="I agree to the Terms of Service and Privacy Policy"
              value="true"
              checked={this.state.agreetos === "true"}
              onChange={this.handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Register
          </Button>
        </Form>
      </>
    );
  }
}

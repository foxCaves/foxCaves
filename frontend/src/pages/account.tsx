import { FormEvent } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FormBasePage } from './base';
import { fetchAPIRaw } from '../utils/api';
import { AlertClass, AppContext, AppContextClass } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Modal from 'react-bootstrap/Modal';
import { Col, Row } from 'react-bootstrap';

interface AccountPageState {
    current_password: string;
    new_password: string;
    new_password_confirm: string;
    email: string;
    showDeleteAccountModal: boolean;
}

export class AccountPage extends FormBasePage<{}, AccountPageState> {
    static contextType = AppContext;
    context!: AppContextClass;

    constructor(props: {}) {
        super(props);
        this.state = {
            current_password: '',
            new_password: '',
            new_password_confirm: '',
            email: '',
            showDeleteAccountModal: false,
        };

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleAPIKeyRegen = this.handleAPIKeyRegen.bind(this);
        this.handleKillSessions = this.handleKillSessions.bind(this);
        this.handleDeleteAccount = this.handleDeleteAccount.bind(this);
        this.closeDeleteAccountModal = this.closeDeleteAccountModal.bind(this);
        this.showDeleteAccountModal = this.showDeleteAccountModal.bind(this);
    }

    componentDidMount() {
        this.updateStateDefaults();
    }

    updateStateDefaults() {
        this.setState({
            current_password: '',
            new_password: '',
            new_password_confirm: '',
            email: this.context.user!.email!,
            showDeleteAccountModal: false,
        });
    }

    closeAlert() {
        this.context.closeAlert('account');
    }

    showAlert(alert: AlertClass) {
        this.closeAlert();
        this.context.showAlert(alert);
    }

    async handleAPIKeyRegen(event: FormEvent) {
        event.preventDefault();
        await this.sendUserChange({
            apikey: 'CHANGE',
        });
    }

    closeDeleteAccountModal() {
        this.setState({ showDeleteAccountModal: false });
    }

    showDeleteAccountModal() {
        this.setState({ showDeleteAccountModal: true });
    }

    async handleDeleteAccount(event: FormEvent) {
        event.preventDefault();
        await this.sendUserChange({}, 'DELETE');
        this.closeDeleteAccountModal();
    }

    async handleKillSessions(event: FormEvent) {
        event.preventDefault();
        await this.sendUserChange({
            loginkey: 'CHANGE',
        });
    }

    async handleSubmit(event: FormEvent<HTMLFormElement>) {
        this.closeAlert();
        if (this.state.new_password !== this.state.new_password_confirm) {
            this.showAlert({
                id: 'account',
                contents: 'New passwords do not match',
                variant: 'danger',
                timeout: 5000,
            });
            return;
        }

        event.preventDefault();
        await this.sendUserChange({
            current_password: this.state.current_password,
            password: this.state.new_password,
            email: this.state.email,
        });
    }

    async sendUserChange(
        data: { [key: string]: string },
        method: string = 'PATCH',
    ) {
        this.closeAlert();
        data.current_password = this.state.current_password;
        try {
            await fetchAPIRaw(`/api/v1/users/${this.context.user!.id}`, {
                method,
                body: new URLSearchParams(data),
            });
        } catch (err) {
            this.showAlert({
                id: 'account',
                contents: err.message,
                variant: 'danger',
                timeout: 5000,
            });
            return false;
        }
        await this.context.refreshUser();
        this.showAlert({
            id: 'account',
            contents: 'Account change successful!',
            variant: 'success',
            timeout: 2000,
        });
        this.updateStateDefaults();
        return true;
    }

    render() {
        return (
            <>
                <Modal
                    show={this.state.showDeleteAccountModal}
                    onHide={this.closeDeleteAccountModal}
                >
                    <Modal.Header closeButton>
                        <Modal.Title>Delete account</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <p>Are you sure to delete your account?</p>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button
                            variant="secondary"
                            onClick={this.closeDeleteAccountModal}
                        >
                            No
                        </Button>
                        <Button
                            variant="danger"
                            onClick={this.handleDeleteAccount}
                        >
                            Yes, delete all my data
                        </Button>
                    </Modal.Footer>
                </Modal>
                <h1>Manage account</h1>
                <br />
                <Form onSubmit={this.handleSubmit}>
                    <FloatingLabel className="mb-3" label="Current password">
                        <Form.Control
                            name="current_password"
                            type="password"
                            placeholder="password"
                            required
                            value={this.state.current_password}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="Username">
                        <Form.Control
                            readOnly
                            name="username"
                            type="text"
                            placeholder="testuser"
                            value={this.context.user!.username}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="New password">
                        <Form.Control
                            name="new_password"
                            type="password"
                            placeholder="password"
                            value={this.state.new_password}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel
                        className="mb-3"
                        label="Confirm new password"
                    >
                        <Form.Control
                            name="new_password_confirm"
                            type="password"
                            placeholder="password"
                            value={this.state.new_password_confirm}
                            onChange={this.handleChange}
                        />
                    </FloatingLabel>
                    <FloatingLabel className="mb-3" label="E-Mail">
                        <Form.Control
                            name="email"
                            type="email"
                            placeholder="test@example.com"
                            value={this.state.email}
                            onChange={this.handleChange}
                        />
                        <Form.Label>E-Mail</Form.Label>
                    </FloatingLabel>
                    <Row>
                        <Col>
                            <FloatingLabel className="mb-3" label="API key">
                                <Form.Control
                                    readOnly
                                    name="apikey"
                                    type="text"
                                    placeholder="ABCDefgh"
                                    value={this.context.user!.apikey!}
                                />
                                <Form.Label>API key</Form.Label>
                            </FloatingLabel>
                        </Col>
                        <Col xs="auto">
                            <Button
                                variant="primary"
                                type="button"
                                size="lg"
                                onClick={this.handleAPIKeyRegen}
                            >
                                Regenerate
                            </Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Button variant="primary" type="submit" size="lg">
                                Change password / E-Mail
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                variant="warning"
                                type="button"
                                size="lg"
                                onClick={this.handleKillSessions}
                            >
                                Kill all sessions
                            </Button>
                        </Col>
                        <Col>
                            <Button
                                variant="danger"
                                type="button"
                                size="lg"
                                onClick={this.showDeleteAccountModal}
                            >
                                Delete account
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </>
        );
    }
}

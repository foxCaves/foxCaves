import React from 'react';
import { LinkModel } from '../models/link';
import { Table } from 'react-bootstrap';

interface LinksState {
    links: LinkModel[];
    linksLoaded: boolean;
}

export class LinksPage extends React.Component<{}, LinksState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            links: [],
            linksLoaded: false,
        };
    }

    async componentDidMount() {
        await this.refreshFiles();
    }

    async refreshFiles() {
        const links = await LinkModel.getAll();
        this.setState({
            links,
            linksLoaded: true,
        });
    }

    renderLinksA() {
        return this.state.links.map(link => {
            return (
                <tr key={link.id}>
                    <td><a rel="noreferrer" target="_blank" href={link.short_url}>{link.short_url}</a></td>
                    <td><a rel="noreferrer" target="_blank" href={link.url}>{link.url}</a></td>
                    <td></td>
                </tr>
            );
        });
    }

    renderLinks() {
        return (
            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Short link</th>
                        <th>Target</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {this.renderLinksA()}
                </tbody>
            </Table>
        );
    }

    renderLoading() {
        return <p>Loading...</p>;
    }

    render() {
        return (
            <div>
                <h1>Manage links</h1>
                <br />
                {this.state.linksLoaded ? this.renderLinks() : this.renderLoading()}
            </div>
        );
    }
}

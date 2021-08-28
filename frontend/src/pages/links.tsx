import React, { useState } from 'react';
import { LinkModel } from '../models/link';
import { Table } from 'react-bootstrap';
import { useEffect } from 'react';

export const LinksPage: React.FC<{}> = () => {
    const [links, setLinks] = useState<LinkModel[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    async function refresh() {
        const links = await LinkModel.getAll();
        setLinks(links);
    }

    useEffect(() => {
        if (loading || links) {
            return;
        }
        setLoading(true);
        refresh().then(() => setLoading(false));
    }, [loading, links]);

    if (loading || !links) {
        return (
            <div>
                <h1>Manage links</h1>
                <br />
                <h3>Loading...</h3>
            </div>
        );
    }

    return (
        <div>
            <h1>Manage links</h1>
            <br />
            <Table striped bordered>
                <thead>
                    <tr>
                        <th>Short link</th>
                        <th>Target</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {links.map((link) => (
                        <tr key={link.id}>
                            <td>
                                <a
                                    rel="noreferrer"
                                    target="_blank"
                                    href={link.short_url}
                                >
                                    {link.short_url}
                                </a>
                            </td>
                            <td>
                                <a
                                    rel="noreferrer"
                                    target="_blank"
                                    href={link.url}
                                >
                                    {link.url}
                                </a>
                            </td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

import React, { useState } from 'react';
import { LinkModel } from '../models/link';
import { Button, Table } from 'react-bootstrap';
import { useEffect } from 'react';

export const LinkView: React.FC<{ link: LinkModel }> = ({ link }) => {
    return (
        <tr>
            <td>
                <a rel="noreferrer" target="_blank" href={link.short_url}>
                    {link.short_url}
                </a>
            </td>
            <td>
                <a rel="noreferrer" target="_blank" href={link.url}>
                    {link.url}
                </a>
            </td>
            <td>
                <Button variant="danger" onClick={() => link.delete()}>
                    Delete
                </Button>
            </td>
        </tr>
    );
};

type LinkMap = { [key: string]: LinkModel };

export const LinksPage: React.FC<{}> = () => {
    const [links, setLinks] = useState<LinkMap | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    async function refresh() {
        const linksArray = await LinkModel.getAll();
        const linksMap: LinkMap = {};
        for (const link of linksArray) {
            linksMap[link.id] = link;
        }
        setLinks(linksMap);
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
            <>
                <h1>Manage links</h1>
                <br />
                <h3>Loading...</h3>
            </>
        );
    }

    return (
        <>
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
                    {Object.values(links).map((link) => (
                        <LinkView key={link.id} link={link} />
                    ))}
                </tbody>
            </Table>
        </>
    );
};

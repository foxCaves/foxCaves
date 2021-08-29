import React, { useContext, useState } from 'react';
import { LinkModel } from '../models/link';
import { Button, Form, Table } from 'react-bootstrap';
import { useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { AppContext } from '../utils/context';

export const LinkView: React.FC<{
    link: LinkModel;
    setDeleteLink: (link: LinkModel | undefined) => void;
}> = ({ link, setDeleteLink }) => {
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
                <Button variant="danger" onClick={() => setDeleteLink(link)}>
                    Delete
                </Button>
            </td>
        </tr>
    );
};

type LinkMap = { [key: string]: LinkModel };

export const LinksPage: React.FC<{}> = () => {
    const { showAlert } = useContext(AppContext);
    const [links, setLinks] = useState<LinkMap | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [deleteLink, setDeleteLink] = useState<LinkModel | undefined>(
        undefined,
    );
    const [showCreateLink, setShowCreateLink] = useState<boolean>(false);
    const [createLinkUrl, setCreateLinkUrl] = useState<string>('');

    async function refresh() {
        const linksArray = await LinkModel.getAll();
        const linksMap: LinkMap = {};
        for (const link of linksArray) {
            linksMap[link.id] = link;
        }
        setLinks(linksMap);
    }

    async function handleDeleteLink() {
        const link = deleteLink;
        if (link) {
            try {
                await link.delete();
                showAlert({
                    id: `link_${link.id}`,
                    contents: `Link ${link.short_url} deleted`,
                    variant: 'success',
                    timeout: 5000,
                });
                delete links![link.id];
                setLinks(links);
            } catch (err) {
                showAlert({
                    id: `link_${link.id}`,
                    contents: `Error deleting link: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
            }
        }
        setDeleteLink(undefined);
    }

    async function handleCreateLink() {
        try {
            const link = await LinkModel.create(createLinkUrl);
            showAlert({
                id: `link_new`,
                contents: `Link ${link.short_url} created.`,
                variant: 'success',
                timeout: 5000,
            });
            links![link.id] = link;
            setLinks(links);
        } catch (err) {
            showAlert({
                id: `link_new}`,
                contents: `Error creating link: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
        }
        setShowCreateLink(false);
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
            <Modal show={deleteLink} onHide={() => setDeleteLink(undefined)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Are you sure to delete the link "{deleteLink?.short_url}
                        "?
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteLink(undefined)}
                    >
                        No
                    </Button>
                    <Button variant="primary" onClick={handleDeleteLink}>
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                show={showCreateLink}
                onHide={() => setShowCreateLink(false)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Shorten link</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Please enter the link you would like to shorten:
                        <Form.Control
                            type="text"
                            name="createLink"
                            value={createLinkUrl}
                            onChange={(e) => setCreateLinkUrl(e.target.value)}
                        />
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowCreateLink(false)}
                    >
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateLink}>
                        Shorten
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>
                Manage links{' '}
                <Button
                    variant="primary"
                    onClick={() => {
                        setCreateLinkUrl('');
                        setShowCreateLink(true);
                    }}
                >
                    Create new link
                </Button>
            </h1>
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
                        <LinkView
                            key={link.id}
                            setDeleteLink={setDeleteLink}
                            link={link}
                        />
                    ))}
                </tbody>
            </Table>
        </>
    );
};

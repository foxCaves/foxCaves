import { Button, Form, Table } from 'react-bootstrap';
import React, { useContext, useState } from 'react';

import { LinkModel } from '../models/link';
import { LinksContext } from '../components/liveloading';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useInputFieldSetter } from '../utils/hooks';

export const LinkView: React.FC<{
    link: LinkModel;
    setDeleteLink: (link: LinkModel | undefined) => void;
}> = ({ link, setDeleteLink }) => {
    const setDeleteLinkCB = useCallback(() => {
        setDeleteLink(link);
    }, [link, setDeleteLink]);

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
                <Button variant="danger" onClick={setDeleteLinkCB}>
                    Delete
                </Button>
            </td>
        </tr>
    );
};

export const LinksPage: React.FC<{}> = () => {
    const { refresh, set, models } = useContext(LinksContext);
    const [loading, setLoading] = useState(false);
    const [deleteLink, setDeleteLink] = useState<LinkModel | undefined>(undefined);
    const [showCreateLink, setShowCreateLink] = useState<boolean>(false);
    const [createLinkUrl, setCreateLinkUrlCB, setCreateLinkUrl] = useInputFieldSetter('https://');

    const handleDeleteLink = useCallback(async () => {
        const link = deleteLink;
        if (link) {
            try {
                await toast.promise(link.delete(), {
                    success: `Link "${link.short_url}" deleted`,
                    pending: `Deleting link "${link.short_url}"...`,
                    error: {
                        render({ data }) {
                            const err = data as Error;
                            return `Error deleting link: ${err.message}`;
                        },
                    },
                });

                const modelsCopy = { ...models };
                delete modelsCopy[link.id];
                set(modelsCopy);
            } catch {}
        }
        setDeleteLink(undefined);
    }, [deleteLink, models, set]);

    const handleCreateLink = useCallback(async () => {
        try {
            const link = await toast.promise(LinkModel.create(createLinkUrl), {
                success: `Link "${createLinkUrl}" created!`,
                pending: `Creating link "${createLinkUrl}"...`,
                error: {
                    render({ data }) {
                        const err = data as Error;
                        return `Error creating link "${createLinkUrl}": ${err.message}`;
                    },
                },
            });

            const modelsCopy = { ...models };
            modelsCopy[link.id] = link;
            set(modelsCopy);
        } catch {}
        setShowCreateLink(false);
    }, [createLinkUrl, models, set]);

    const showCreateLinkDialog = useCallback(() => {
        setCreateLinkUrl('https://');
        setShowCreateLink(true);
    }, [setCreateLinkUrl]);

    const hideCreateLinkDialog = useCallback(() => {
        setShowCreateLink(false);
    }, []);

    const hideDeleteLinkDialog = useCallback(() => {
        setDeleteLink(undefined);
    }, []);

    useEffect(() => {
        if (loading || models) {
            return;
        }
        setLoading(true);
        refresh().then(() => setLoading(false));
    }, [refresh, loading, models]);

    const refreshButton = useCallback(async () => {
        try {
            await toast.promise(refresh(), {
                success: 'Links refreshed!',
                pending: 'Refreshing links...',
                error: {
                    render({ data }) {
                        const err = data as Error;
                        return `Error refreshing links: ${err.message}`;
                    },
                },
            });
        } catch {}
    }, [refresh]);

    if (loading || !models) {
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
            <Modal show={!!deleteLink} onHide={hideDeleteLinkDialog}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure to delete the link "{deleteLink?.short_url}"?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={hideDeleteLinkDialog}>
                        No
                    </Button>
                    <Button variant="primary" onClick={handleDeleteLink}>
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={showCreateLink} onHide={hideCreateLinkDialog}>
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
                            onChange={setCreateLinkUrlCB}
                        />
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={hideCreateLinkDialog}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateLink}>
                        Shorten
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>
                Manage links
                <span className="p-3"></span>
                <Button variant="primary" onClick={showCreateLinkDialog}>
                    Create new link
                </Button>
                <span className="p-3"></span>
                <Button variant="secondary" onClick={refreshButton}>
                    Refresh
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
                    {Object.values(models).map((link) => (
                        <LinkView key={link.id} setDeleteLink={setDeleteLink} link={link} />
                    ))}
                </tbody>
            </Table>
        </>
    );
};

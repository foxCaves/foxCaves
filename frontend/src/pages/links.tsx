import React, { useContext, useState } from 'react';
import { LinkModel } from '../models/link';
import { Button, Form, Table } from 'react-bootstrap';
import { useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import { AppContext } from '../utils/context';
import { useCallback } from 'react';
import { useInputFieldSetter } from '../utils/hooks';
import { LinksContext } from '../utils/liveloading';

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
    const { showAlert } = useContext(AppContext);
    const { refresh, set, models } = useContext(LinksContext);
    const [loading, setLoading] = useState(false);
    const [deleteLink, setDeleteLink] = useState<LinkModel | undefined>(undefined);
    const [showCreateLink, setShowCreateLink] = useState<boolean>(false);
    const [createLinkUrl, setCreateLinkUrlCB, setCreateLinkUrl] = useInputFieldSetter('https://');

    const handleDeleteLink = useCallback(async () => {
        const link = deleteLink;
        if (link) {
            try {
                await link.delete();
                showAlert({
                    id: `link_${link.id}`,
                    contents: `Link "${link.short_url}" deleted`,
                    variant: 'success',
                    timeout: 5000,
                });
                delete models![link.id];
                set(models!);
            } catch (err: any) {
                showAlert({
                    id: `link_${link.id}`,
                    contents: `Error deleting link: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
            }
        }
        setDeleteLink(undefined);
    }, [deleteLink, models, set, showAlert]);

    const handleCreateLink = useCallback(async () => {
        try {
            const link = await LinkModel.create(createLinkUrl);
            showAlert({
                id: 'link_new',
                contents: `Link "${link.short_url}" created.`,
                variant: 'success',
                timeout: 5000,
            });
            models![link.id] = link;
            set(models!);
        } catch (err: any) {
            showAlert({
                id: 'link_new',
                contents: `Error creating link: ${err.message}`,
                variant: 'danger',
                timeout: 5000,
            });
        }
        setShowCreateLink(false);
    }, [createLinkUrl, models, set, showAlert]);

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
            <Modal show={deleteLink} onHide={hideDeleteLinkDialog}>
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

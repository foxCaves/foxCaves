import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { LinksContext } from '../components/liveloading';
import { LinkModel } from '../models/link';
import { AppContext } from '../utils/context';
import { useInputFieldSetter } from '../utils/hooks';
import { logError, sortByDate } from '../utils/misc';

const LinkView: React.FC<{
    readonly link: LinkModel;
    readonly setDeleteLink: (link: LinkModel | undefined) => void;
}> = ({ link, setDeleteLink }) => {
    const setDeleteLinkCB = useCallback(() => {
        setDeleteLink(link);
    }, [link, setDeleteLink]);

    return (
        <tr>
            <td>
                <a href={link.url} rel="noreferrer" target="_blank">
                    {link.url}
                </a>
            </td>
            <td>
                <a href={link.target} rel="noreferrer" target="_blank">
                    {link.target}
                </a>
            </td>
            <td>
                <Button onClick={setDeleteLinkCB} variant="danger">
                    Delete
                </Button>
            </td>
        </tr>
    );
};

export const LinksPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const { refresh, set, models } = useContext(LinksContext);
    const [loading, setLoading] = useState(false);
    const [deleteLink, setDeleteLink] = useState<LinkModel | undefined>(undefined);
    const [showCreateLink, setShowCreateLink] = useState<boolean>(false);
    const [createLinkUrl, setCreateLinkUrlCB, setCreateLinkUrl] = useInputFieldSetter('https://');

    const handleDeleteLink = useCallback(() => {
        if (!deleteLink) {
            return;
        }

        toast
            .promise(deleteLink.delete(apiAccessor), {
                success: `Deleted link "${deleteLink.url}"!`,
                pending: `Deleting link "${deleteLink.url}"...`,
                error: {
                    render({ data }) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        const err = data as Error;
                        return `Error deleting link: ${err.message}`;
                    },
                },
            })
            .then(() => {
                const modelsCopy = new Map(models);
                modelsCopy.delete(deleteLink.id);
                set(modelsCopy);
            }, logError)
            .finally(() => {
                setDeleteLink(undefined);
            });
    }, [deleteLink, models, set, apiAccessor]);

    const handleCreateLink = useCallback(() => {
        toast
            .promise(LinkModel.create(createLinkUrl, apiAccessor), {
                success: `Created link "${createLinkUrl}"!`,
                pending: `Creating link "${createLinkUrl}"...`,
                error: {
                    render({ data }) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        const err = data as Error;
                        return `Error creating link "${createLinkUrl}": ${err.message}`;
                    },
                },
            })
            .then((link) => {
                const modelsCopy = new Map(models);
                modelsCopy.set(link.id, link);
                set(modelsCopy);
            }, logError)
            .finally(() => {
                setShowCreateLink(false);
            });
    }, [createLinkUrl, models, set, apiAccessor]);

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

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        refresh().then(() => {
            setLoading(false);
        }, logError);
    }, [refresh, loading, models]);

    const refreshButton = useCallback(() => {
        toast
            .promise(refresh(), {
                success: 'Links refreshed!',
                pending: 'Refreshing links...',
                error: {
                    render({ data }) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        const err = data as Error;
                        return `Error refreshing links: ${err.message}`;
                    },
                },
            })
            .catch(logError);
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
            <Modal onHide={hideDeleteLinkDialog} show={!!deleteLink}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Are you sure to delete the link "{deleteLink?.url}"?</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={hideDeleteLinkDialog} variant="secondary">
                        No
                    </Button>
                    <Button onClick={handleDeleteLink} variant="primary">
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal onHide={hideCreateLinkDialog} show={showCreateLink}>
                <Modal.Header closeButton>
                    <Modal.Title>Create link</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Please enter the target of the link:
                        <Form.Control
                            name="createLink"
                            onChange={setCreateLinkUrlCB}
                            type="text"
                            value={createLinkUrl}
                        />
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={hideCreateLinkDialog} variant="secondary">
                        Cancel
                    </Button>
                    <Button onClick={handleCreateLink} variant="primary">
                        Create
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>
                Manage links
                <span className="p-3" />
                <Button onClick={showCreateLinkDialog} variant="primary">
                    Create new link
                </Button>
                <span className="p-3" />
                <Button onClick={refreshButton} variant="secondary">
                    Refresh
                </Button>
            </h1>
            <br />
            <Table bordered striped>
                <thead>
                    <tr>
                        <th>Link</th>
                        <th>Target</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from(models.values())
                        // eslint-disable-next-line unicorn/no-array-sort
                        .sort(sortByDate)
                        .map((link) => (
                            <LinkView key={link.id} link={link} setDeleteLink={setDeleteLink} />
                        ))}
                </tbody>
            </Table>
        </>
    );
};

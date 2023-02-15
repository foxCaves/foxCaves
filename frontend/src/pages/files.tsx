import '../resources/files.css';

import React, { KeyboardEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Ratio from 'react-bootstrap/Ratio';
import { useDropzone } from 'react-dropzone';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FilesContext } from '../components/liveloading';
import { StorageUseBar } from '../components/storage_use';
import { FileModel } from '../models/file';
import noThumbnail from '../resources/nothumb.gif';
import { uploadFile } from '../utils/file_uploader';
import { useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

const FileView: React.FC<{
    file: FileModel;
    setDeleteFile: (file: FileModel | undefined) => void;
    setEditFile: (file: FileModel | undefined) => void;
    editMode: boolean;
}> = ({ file, editMode, setDeleteFile, setEditFile }) => {
    const [editFileName, setEditFileName] = useInputFieldSetter(file.name);

    const isImage = file.mimetype.startsWith('image/');

    const onKeyDownEdit = useCallback(
        async (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const oldName = file.name;
                const newName = editFileName;
                if (oldName === newName) {
                    setEditFile(undefined);
                    return;
                }

                try {
                    await toast.promise(file.rename(editFileName), {
                        success: `File "${oldName}" renamed to "${newName}"`,
                        pending: `Renaming file "${oldName}" to "${newName}"...`,
                        error: {
                            render({ data }) {
                                const err = data as Error;
                                return `Error renaming file "${oldName}" to "${newName}": ${err.message}`;
                            },
                        },
                    });
                } catch {}

                setEditFile(undefined);
            } else if (e.key === 'Escape') {
                setEditFile(undefined);
            }
        },
        [file, editFileName, setEditFile],
    );

    const setEditFileCB = useCallback(() => {
        setEditFile(file);
    }, [file, setEditFile]);

    const setDeleteFileCB = useCallback(() => {
        setDeleteFile(file);
    }, [file, setDeleteFile]);

    return (
        <Card bg="primary" className="file-card" text="white">
            <Card.Header title={file.name}>
                {editMode ? (
                    <Form.Control
                        onChange={setEditFileName}
                        onKeyDown={onKeyDownEdit}
                        type="text"
                        value={editFileName}
                    />
                ) : (
                    file.name
                )}
            </Card.Header>
            <Card.Body>
                <Ratio aspectRatio="1x1">
                    <Link to={`/view/${file.id}`}>
                        <Card.Img src={file.thumbnail_url || noThumbnail} variant="top" />
                    </Link>
                </Ratio>
            </Card.Body>
            <Card.Footer className="d-flex">
                <div className="flex-grow-1 p-1">{file.getFormattedSize()}</div>
                <Dropdown>
                    <Dropdown.Toggle />
                    <Dropdown.Menu>
                        <LinkContainer to={`/view/${file.id}`}>
                            <Dropdown.Item>View</Dropdown.Item>
                        </LinkContainer>
                        {isImage ? (
                            <LinkContainer to={`/livedraw/${file.id}`}>
                                <Dropdown.Item>Live draw</Dropdown.Item>
                            </LinkContainer>
                        ) : null}
                        <Dropdown.Item href={file.download_url}>Download</Dropdown.Item>
                        <Dropdown.Item onClick={setEditFileCB}>Rename</Dropdown.Item>
                        <Dropdown.Item onClick={setDeleteFileCB}>Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Card.Footer>
        </Card>
    );
};

export const FilesPage: React.FC = () => {
    const { refresh, set, models } = useContext(FilesContext);
    const [loading, setLoading] = useState(false);
    const [deleteFile, setDeleteFile] = useState<FileModel | undefined>(undefined);
    const [editFile, setEditFile] = useState<FileModel | undefined>(undefined);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                try {
                    const fileObj = await uploadFile(file);

                    const modelsCopy = { ...models };
                    modelsCopy[fileObj.id] = fileObj;
                    set(modelsCopy);
                } catch {}
            }
        },
        [models, set],
    );

    const dropzone = useDropzone({
        onDrop,
    });

    const handleDeleteFile = useCallback(() => {
        if (!deleteFile) {
            return;
        }

        toast
            .promise(deleteFile.delete(), {
                success: `File "${deleteFile.name}" deleted!`,
                pending: `Deleting file "${deleteFile.name}"...`,
                error: {
                    render({ data }) {
                        const err = data as Error;
                        return `Error deleting file "${deleteFile.name}": ${err.message}`;
                    },
                },
            })
            .then(() => {
                const modelsCopy = { ...models };
                delete modelsCopy[deleteFile.id];
                set(modelsCopy);
            })
            .finally(() => {
                setDeleteFile(undefined);
            });
    }, [deleteFile, set, models]);

    const unsetDeleteFile = useCallback(() => {
        setDeleteFile(undefined);
    }, []);

    useEffect(() => {
        if (loading || models) {
            return;
        }

        setLoading(true);
        refresh().then(() => {
            setLoading(false);
        }, logError);
    }, [loading, models, refresh]);

    const refreshButton = useCallback(() => {
        toast
            .promise(refresh(), {
                success: 'Files refreshed!',
                pending: 'Refreshing files...',
                error: {
                    render({ data }) {
                        const err = data as Error;
                        return `Error refreshing files: ${err.message}`;
                    },
                },
            })
            .catch(logError);
    }, [refresh]);

    if (loading || !models) {
        return (
            <>
                <h1>Manage files</h1>
                <StorageUseBar />
                <br />
                <h3>Loading...</h3>
            </>
        );
    }

    return (
        <>
            <Modal onHide={unsetDeleteFile} show={!!deleteFile}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Are you sure to delete the file "{deleteFile?.name}"?</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={unsetDeleteFile} variant="secondary">
                        No
                    </Button>
                    <Button onClick={handleDeleteFile} variant="primary">
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>
                Manage files
                <span className="p-3" />
                <Button onClick={refreshButton} variant="secondary">
                    Refresh
                </Button>
            </h1>
            <StorageUseBar />
            <Container>
                <Row className="mt-2">
                    <Col
                        className="pt-3 pb-3 border border-1 border-info rounded d-flex justify-content-center"
                        {...dropzone.getRootProps()}
                    >
                        <input {...dropzone.getInputProps()} />
                        <h4 className="m-0">
                            {dropzone.isDragActive ? (
                                <>Drop the file here to upload it!</>
                            ) : (
                                <>Drag 'n' drop some files here, or click to select files to upload</>
                            )}
                        </h4>
                    </Col>
                </Row>
            </Container>
            <Container className="mt-2 justify-content-center">
                <Row>
                    {Object.values(models).map((file) => {
                        return (
                            <Col className="col-auto mb-3" key={file.id}>
                                <FileView
                                    editMode={editFile === file}
                                    file={file}
                                    setDeleteFile={setDeleteFile}
                                    setEditFile={setEditFile}
                                />
                            </Col>
                        );
                    })}
                </Row>
            </Container>
        </>
    );
};

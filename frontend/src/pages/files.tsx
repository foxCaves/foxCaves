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
import { Link } from 'react-router';
import { toast } from 'react-toastify';
import { LinkContainer } from '../components/link_container';
import { FilesContext } from '../components/liveloading';
import { StorageUseBar } from '../components/storage_use';
import { FileModel } from '../models/file';
import noThumbnail from '../resources/nothumb.gif';
import { AppContext } from '../utils/context';
import { uploadFile } from '../utils/file_uploader';
import { useInputFieldSetter } from '../utils/hooks';
import { logError, sortByDate } from '../utils/misc';

const FileView: React.FC<{
    readonly file: FileModel;
    readonly setDeleteFile: (file: FileModel | undefined) => void;
    readonly setEditFile: (file: FileModel | undefined) => void;
    readonly editMode: boolean;
}> = ({ file, editMode, setDeleteFile, setEditFile }) => {
    const { apiAccessor } = useContext(AppContext);
    const [editFileName, setEditFileName] = useInputFieldSetter(file.name);

    const isImage = file.isImage();

    const onKeyDownEdit = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const oldName = file.name;
                const newName = editFileName;
                if (oldName === newName) {
                    setEditFile(undefined);
                    return;
                }

                toast
                    .promise(file.rename(editFileName, apiAccessor), {
                        success: `Renamed file "${oldName}" to "${newName}"!`,
                        pending: `Renaming file "${oldName}" to "${newName}"...`,
                        error: {
                            render({ data }) {
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                                const err = data as Error;
                                return `Error renaming file "${oldName}" to "${newName}": ${err.message}`;
                            },
                        },
                    })
                    .catch(logError)
                    .then(() => {
                        setEditFile(undefined);
                    })
                    .catch(logError);
            } else if (e.key === 'Escape') {
                setEditFile(undefined);
            }
        },
        [file, editFileName, setEditFile, apiAccessor],
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
                        <Card.Img src={file.thumbnail_url ?? noThumbnail} variant="top" />
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
                            <LinkContainer to={`/live_draw/${file.id}`}>
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
    const { apiAccessor } = useContext(AppContext);
    const { refresh, set, models } = useContext(FilesContext);
    const [loading, setLoading] = useState(false);
    const [deleteFile, setDeleteFile] = useState<FileModel | undefined>(undefined);
    const [editFile, setEditFile] = useState<FileModel | undefined>(undefined);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const modelsCopy = new Map(models);

            Promise.all(
                acceptedFiles.map(async (file: File) => {
                    const fileObj = await uploadFile(file, apiAccessor);
                    modelsCopy.set(fileObj.id, fileObj);
                }),
            )
                .catch(logError)
                .then(() => {
                    set(modelsCopy);
                })
                .catch(logError);
        },
        [models, set, apiAccessor],
    );

    const dropzone = useDropzone({
        onDrop,
    });

    const handleDeleteFile = useCallback(() => {
        if (!deleteFile) {
            return;
        }

        toast
            .promise(deleteFile.delete(apiAccessor), {
                success: `Deleted file "${deleteFile.name}"!`,
                pending: `Deleting file "${deleteFile.name}"...`,
                error: {
                    render({ data }) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                        const err = data as Error;
                        return `Error deleting file "${deleteFile.name}": ${err.message}`;
                    },
                },
            })
            .then(() => {
                const modelsCopy = new Map(models);
                modelsCopy.delete(deleteFile.id);
                set(modelsCopy);
            }, logError)
            .finally(() => {
                setDeleteFile(undefined);
            });
    }, [deleteFile, set, models, apiAccessor]);

    const unsetDeleteFile = useCallback(() => {
        setDeleteFile(undefined);
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
    }, [loading, models, refresh]);

    const refreshButton = useCallback(() => {
        toast
            .promise(refresh(), {
                success: 'Refreshed files!',
                pending: 'Refreshing files...',
                error: {
                    render({ data }) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
                        className="pt-3 pb-3 border border-1 border-info rounded d-flex justify-content-center file-drop-zone"
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
                    {Array.from(models.values())
                        // eslint-disable-next-line unicorn/no-array-sort
                        .sort(sortByDate)
                        .map((file) => {
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

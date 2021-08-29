import React, { useContext, useState, useEffect, KeyboardEvent } from 'react';
import { FileModel } from '../models/file';
import { StorageUseBar } from '../utils/storage_use';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { AppContext } from '../utils/context';
import { Col, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

export const FileView: React.FC<{
    file: FileModel;
    setDeleteFile: (file: FileModel | undefined) => void;
    setEditFile: (file: FileModel | undefined) => void;
    editMode: boolean;
}> = ({ file, editMode, setDeleteFile, setEditFile }) => {
    const { showAlert } = useContext(AppContext);
    const [editFileName, setEditFileName] = useState(file.name);

    async function onKeyDownEdit(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            try {
                await file.rename(editFileName);
                showAlert({
                    id: `file_${file.id}`,
                    contents: `File renamed to ${file.name}`,
                    variant: 'success',
                    timeout: 5000,
                });
            } catch (err: any) {
                showAlert({
                    id: `file_${file.id}`,
                    contents: `Error renaming file: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
            }
            setEditFile(undefined);
        } else if (e.key === 'Escape') {
            setEditFile(undefined);
        }
    }

    return (
        <Card text="white" bg="primary" style={{ width: '10rem' }}>
            <Card.Header>
                {editMode ? (
                    <Form.Control
                        type="text"
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        onKeyDown={onKeyDownEdit}
                    />
                ) : (
                    file.name
                )}
            </Card.Header>
            <Card.Body>
                <Card.Img variant="top" src={file.thumbnail_image} />
            </Card.Body>
            <Card.Footer className="d-flex">
                <div className="flex-grow-1 p-1">{file.getFormattedSize()}</div>
                <Dropdown>
                    <Dropdown.Toggle />
                    <Dropdown.Menu>
                        <LinkContainer to={`/view/${file.id}`}>
                            <Dropdown.Item>View</Dropdown.Item>
                        </LinkContainer>
                        <Dropdown.Item href={file.download_url}>
                            Download
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setEditFile(file)}>
                            Rename
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => setDeleteFile(file)}>
                            Delete
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Card.Footer>
        </Card>
    );
};

type FileMap = { [key: string]: FileModel };

export const FilesPage: React.FC<{}> = () => {
    const { showAlert } = useContext(AppContext);
    const [files, setFiles] = useState<FileMap | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    const [deleteFile, setDeleteFile] = useState<FileModel | undefined>(
        undefined,
    );

    const [editFile, setEditFile] = useState<FileModel | undefined>(undefined);

    async function refresh() {
        const filesArray = await FileModel.getAll();
        const filesMap: FileMap = {};
        for (const file of filesArray) {
            filesMap[file.id] = file;
        }
        setFiles(filesMap);
    }

    async function handleDeleteFile() {
        const file = deleteFile;
        if (file) {
            try {
                await file.delete();
                showAlert({
                    id: `file_${file.id}`,
                    contents: `File ${file.name} deleted`,
                    variant: 'success',
                    timeout: 5000,
                });
                delete files![file.id];
                setFiles(files);
            } catch (err: any) {
                showAlert({
                    id: `file_${file.id}`,
                    contents: `Error deleting file: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
            }
        }
        setDeleteFile(undefined);
    }

    useEffect(() => {
        if (loading || files) {
            return;
        }
        setLoading(true);
        refresh().then(() => setLoading(false));
    }, [loading, files]);

    if (loading || !files) {
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
            <Modal show={deleteFile} onHide={() => setDeleteFile(undefined)}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Are you sure to delete the file "{deleteFile?.name}
                        "?
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteFile(undefined)}
                    >
                        No
                    </Button>
                    <Button variant="primary" onClick={handleDeleteFile}>
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>Manage files</h1>
            <StorageUseBar />
            <br />
            <Row>
                {Object.values(files).map((file) => {
                    return (
                        <Col key={file.id} className="col-auto mb-3">
                            <FileView
                                file={file}
                                setDeleteFile={setDeleteFile}
                                setEditFile={setEditFile}
                                editMode={editFile === file}
                            />
                        </Col>
                    );
                })}
            </Row>
        </>
    );
};

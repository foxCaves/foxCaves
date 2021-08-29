import React, { useContext, useState, useEffect } from 'react';
import { FileModel } from '../models/file';
import { StorageUseBar } from '../utils/storage_use';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { AppContext } from '../utils/context';
import { Col, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

export const FileView: React.FC<{
    file: FileModel;
    showDeleteModal: (file: FileModel) => void;
}> = ({ file, showDeleteModal }) => {
    return (
        <Card text="white" bg="primary" style={{ width: '10rem' }}>
            <Card.Header>{file.name}</Card.Header>
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
                        <Dropdown.Item>Rename</Dropdown.Item>
                        <Dropdown.Item onClick={() => showDeleteModal(file)}>
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

    const [deleteModalFile, setDeleteModalFile] = useState<
        FileModel | undefined
    >(undefined);

    async function refresh() {
        const filesArray = await FileModel.getAll();
        const filesMap: FileMap = {};
        for (const file of filesArray) {
            filesMap[file.id] = file;
        }
        setFiles(filesMap);
    }

    function showDeleteModal(file: FileModel) {
        setDeleteModalFile(file);
    }

    async function handleDeleteFile() {
        const file = deleteModalFile;
        if (file) {
            try {
                await file.delete();
                showAlert({
                    id: 'file',
                    contents: `File ${file.name} deleted`,
                    variant: 'success',
                    timeout: 5000,
                });
                delete files![file.id];
                setFiles(files);
            } catch (err) {
                showAlert({
                    id: 'file',
                    contents: `Error deleting file: ${err.message}`,
                    variant: 'danger',
                    timeout: 5000,
                });
            }
        }
        setDeleteModalFile(undefined);
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
            <Modal
                show={deleteModalFile}
                onHide={() => setDeleteModalFile(undefined)}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Delete file?</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Are you sure to delete the file "{deleteModalFile?.name}
                        "?
                    </p>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModalFile(undefined)}
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
                                showDeleteModal={showDeleteModal}
                            />
                        </Col>
                    );
                })}
            </Row>
        </>
    );
};

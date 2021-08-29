import React, { useContext, useState, useEffect, KeyboardEvent } from 'react';
import { FileModel } from '../models/file';
import { StorageUseBar } from '../utils/storage_use';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { AppContext } from '../utils/context';
import { Col, Container, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { useInputFieldSetter } from '../utils/hooks';

export const FileView: React.FC<{
    file: FileModel;
    setDeleteFile: (file: FileModel | undefined) => void;
    setEditFile: (file: FileModel | undefined) => void;
    editMode: boolean;
}> = ({ file, editMode, setDeleteFile, setEditFile }) => {
    const { showAlert } = useContext(AppContext);
    const [editFileName, setEditFileName] = useInputFieldSetter(file.name);

    const onKeyDownEdit = useCallback(
        async (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                try {
                    await file.rename(editFileName);
                    showAlert({
                        id: `file_${file.id}`,
                        contents: `File renamed to "${file.name}"`,
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
        },
        [file, editFileName, showAlert, setEditFile],
    );

    const setEditFileCB = useCallback(() => {
        setEditFile(file);
    }, [file, setEditFile]);

    const setDeleteFileCB = useCallback(() => {
        setDeleteFile(file);
    }, [file, setDeleteFile]);

    return (
        <Card text="white" bg="primary" style={{ width: '10rem' }}>
            <Card.Header>
                {editMode ? (
                    <Form.Control
                        type="text"
                        value={editFileName}
                        onChange={setEditFileName}
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
                        <Dropdown.Item href={file.download_url}>Download</Dropdown.Item>
                        <Dropdown.Item onClick={setEditFileCB}>Rename</Dropdown.Item>
                        <Dropdown.Item onClick={setDeleteFileCB}>Delete</Dropdown.Item>
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
    const [deleteFile, setDeleteFile] = useState<FileModel | undefined>(undefined);
    const [editFile, setEditFile] = useState<FileModel | undefined>(undefined);
    const [uploadFileName, setUploadFileName] = useState('');

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            for (const file of acceptedFiles) {
                try {
                    setUploadFileName(file.name);
                    const fileObj = await FileModel.upload(file);
                    showAlert({
                        id: `file_${fileObj.id}`,
                        contents: `File "${fileObj.name}" uploaded!`,
                        variant: 'success',
                        timeout: 5000,
                    });
                    files![fileObj.id] = fileObj;
                    setFiles(files);
                } catch (err: any) {
                    showAlert({
                        id: `fileupload_${file.name}`,
                        contents: `Error uploading file: ${err.message}`,
                        variant: 'danger',
                        timeout: 5000,
                    });
                }
            }
            setUploadFileName('');
        },
        [files, showAlert, setUploadFileName],
    );

    const dropzone = useDropzone({
        onDrop,
    });

    const refresh = useCallback(async () => {
        const filesArray = await FileModel.getAll();
        const filesMap: FileMap = {};
        for (const file of filesArray) {
            filesMap[file.id] = file;
        }
        setFiles(filesMap);
    }, []);

    const handleDeleteFile = useCallback(async () => {
        const file = deleteFile;
        if (file) {
            try {
                await file.delete();
                showAlert({
                    id: `file_${file.id}`,
                    contents: `File "${file.name}" deleted`,
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
    }, [deleteFile, files, showAlert]);

    const unsetDeleteFile = useCallback(() => {
        setDeleteFile(undefined);
    }, []);

    useEffect(() => {
        if (loading || files) {
            return;
        }
        setLoading(true);
        refresh().then(() => setLoading(false));
    }, [loading, files, refresh]);

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
            <Modal show={deleteFile} onHide={unsetDeleteFile}>
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
                    <Button variant="secondary" onClick={unsetDeleteFile}>
                        No
                    </Button>
                    <Button variant="primary" onClick={handleDeleteFile}>
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>
            <h1>Manage files</h1>
            <StorageUseBar />
            <Container>
                <Row className="mt-2">
                    <Col
                        className="pt-3 pb-3 border border-1 border-info rounded d-flex justify-content-center"
                        {...dropzone.getRootProps()}
                    >
                        <input {...dropzone.getInputProps()} />
                        {dropzone.isDragActive ? (
                            <h4 className="m-0">Drop the file here to upload it!</h4>
                        ) : (
                            <h4 className="m-0">Drag 'n' drop some files here, or click to select files to upload</h4>
                        )}
                    </Col>
                </Row>
            </Container>
            {uploadFileName ? (
                <Row className="mt-2">
                    <h3>Uploading: {uploadFileName}</h3>
                </Row>
            ) : null}
            <Row className="mt-2">
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

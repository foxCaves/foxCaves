import React, { useState, useEffect } from 'react';
import { FileModel } from '../models/file';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import { Col, Row } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';


export const FileView: React.FC<{ file: FileModel }> = ({ file }) => {
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
                        <LinkContainer to={`/view/${file.id}`}><Dropdown.Item>View</Dropdown.Item></LinkContainer>
                        <Dropdown.Item href={file.download_url}>Download</Dropdown.Item>
                        <Dropdown.Item>Rename</Dropdown.Item>
                        <Dropdown.Item>Delete</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </Card.Footer>
        </Card>
    );
};

export const FilesPage: React.FC<{}> = () => {
    const [files, setFiles] = useState<FileModel[] | undefined>(undefined);
    const [loading, setLoading] = useState(false);

    async function refresh() {
        const files = await FileModel.getAll();
        setFiles(files);
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
            <div>
                <h1>Manage files</h1>
                <br />
                <h3>Loading...</h3>
            </div>
        );
    }

    return (
        <div>
            <h1>Manage files</h1>
            <br />
            <Row>
                {files.map((file) => {
                    return (
                        <Col key={file.id} className="col-auto mb-3">
                            <FileView file={file} />
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

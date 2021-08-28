import React from 'react';
import { FileModel } from '../models/file';
import Card from 'react-bootstrap/Card';
import { Col, Row } from 'react-bootstrap';

interface FilesState {
    files: FileModel[];
    filesLoaded: boolean;
}

export class FilesPage extends React.Component<{}, FilesState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            files: [],
            filesLoaded: false,
        };
    }

    async componentDidMount() {
        await this.refreshFiles();
    }

    async refreshFiles() {
        const files = await FileModel.getAll();
        this.setState({
            files,
            filesLoaded: true,
        });
    }

    renderFilesA(x: number) {
        return this.state.files.map((file) => {
            return (
                <Col key={`${x}_${file.id}`} className="col-auto mb-3">
                    <Card text="white" bg="primary" style={{ width: '10rem' }}>
                        <Card.Header>{file.name}</Card.Header>
                        <Card.Body>
                            <Card.Img
                                variant="top"
                                src={file.thumbnail_image}
                            />
                        </Card.Body>
                        <Card.Footer>{file.getFormattedSize()}</Card.Footer>
                    </Card>
                </Col>
            );
        });
    }

    renderFiles() {
        return (
            <Row>
                {this.renderFilesA(1)}
                {this.renderFilesA(2)}
                {this.renderFilesA(3)}
                {this.renderFilesA(4)}
                {this.renderFilesA(5)}
                {this.renderFilesA(6)}
            </Row>
        );
    }

    renderLoading() {
        return <p>Loading...</p>;
    }

    render() {
        return (
            <div>
                <h1>Manage files</h1>
                <br />
                {this.state.filesLoaded
                    ? this.renderFiles()
                    : this.renderLoading()}
            </div>
        );
    }
}

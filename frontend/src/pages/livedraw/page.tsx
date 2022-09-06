import '../../resources/livedraw.css';

import { BlobWithName, uploadFile } from '../../utils/file_uploader';
import { Navigate, useParams } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import Button from 'react-bootstrap/Button';
import { FileModel } from '../../models/file';
import { Form } from 'react-bootstrap';
import { LiveDrawManager } from './manager';
import RangeSlider from 'react-bootstrap-range-slider';
import { randomString } from '../../utils/random';

export const LiveDrawRedirectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return <Navigate to={`/livedraw/${id}/${randomString(12)}`} />;
};

export const LiveDrawPage: React.FC = () => {
    const { id, sid } = useParams<{ id: string; sid: string }>();
    const [file, setFile] = useState<FileModel | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const brushWidthSliderRef = useRef<HTMLInputElement>(null);
    const managerRef = useRef<LiveDrawManager | undefined>(undefined);
    const [brushWidth, setBrushWidth] = useState(10);

    const fileName = file ? file.name : `ID_${id}`;

    useEffect(() => {
        FileModel.getById(id!).then(setFile, console.error);
    }, [id]);

    const getFileName = useCallback(() => {
        return `${fileName}-edit.png`;
    }, [fileName]);

    const selectBrush = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        managerRef.current?.setBrush(e.target.value);
    }, []);

    const selectBrushWidth = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseInt(e.target.value, 10);
        managerRef.current?.setBrushWidth(v);
        setBrushWidth(v);
    }, []);

    const downloadImage = useCallback(() => {
        const data = canvasRef.current!.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = getFileName();
        link.href = data;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [getFileName]);

    const saveImage = useCallback(() => {
        canvasRef.current!.toBlob(async (blob) => {
            const namedBlob = blob as BlobWithName;
            namedBlob.name = getFileName();
            await uploadFile(namedBlob);
        }, 'image/png');
    }, [getFileName]);

    useEffect(() => {
        const manager = new LiveDrawManager(
            canvasRef.current!,
            foregroundCanvasRef.current!,
            backgroundCanvasRef.current!,
            setBrushWidth,
        );
        managerRef.current = manager;
        return () => {
            manager.destroy();
        };
    }, []);

    useEffect(() => {
        if (!file) {
            return;
        }

        managerRef.current!.setup(file, sid!);
    }, [file, sid]);

    return (
        <>
            <h1>Edit file: {fileName}</h1>
            <br />

            <div id="livedraw-wrapper">
                <canvas ref={canvasRef} id="livedraw"></canvas>
            </div>

            <canvas ref={backgroundCanvasRef} id="livedraw-background"></canvas>
            <canvas ref={foregroundCanvasRef} id="livedraw-foreground"></canvas>

            <div id="live-draw-options">
                <fieldset>
                    <legend>Brush Settings</legend>
                    <Form.Select defaultValue="brush" onChange={selectBrush}>
                        <option>rectangle</option>
                        <option>circle</option>
                        <option>brush</option>
                        <option>erase</option>
                        <option>line</option>
                        <option>restore</option>
                        <option>polygon</option>
                    </Form.Select>
                    <input id="live-draw-text-input" type="text" placeholder="drawtext" />
                    <input id="live-draw-font-input" type="text" defaultValue="Verdana" placeholder="font" />
                    <br />
                    <RangeSlider
                        id="brush-width-slider"
                        ref={brushWidthSliderRef}
                        value={brushWidth}
                        min={1}
                        max={200}
                        step={0.1}
                        onChange={selectBrushWidth}
                    />
                    <br />
                    <div id="color-selector">
                        <svg id="color-selector-inner" xmlns="http://www.w3.org/2000/svg" version="1.1">
                            <line x1="0" y1="5" x2="10" y2="5" />
                            <line x1="5" y1="0" x2="5" y2="10" />
                        </svg>
                    </div>
                    <div id="saturisation-selector">
                        <div id="saturisation-selector-inner"></div>
                    </div>
                    <div id="opacity-selector">
                        <div id="opacity-selector-inner"></div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Utils</legend>
                    <Button variant="primary" onClick={saveImage}>
                        Save Image
                    </Button>
                    <> </>
                    <Button variant="secondary" onClick={downloadImage}>
                        Download
                    </Button>
                </fieldset>
            </div>
        </>
    );
};

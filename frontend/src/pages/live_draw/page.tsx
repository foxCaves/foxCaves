import '../../resources/live_draw.css';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import { Navigate, useParams } from 'react-router-dom';
import { FileModel } from '../../models/file';
import { AppContext } from '../../utils/context';
import { BlobWithName, uploadFile } from '../../utils/file_uploader';
import { logError } from '../../utils/misc';
import { randomString } from '../../utils/random';
import { LiveDrawManager } from './manager';

export const LiveDrawRedirectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return <Navigate to={`/live_draw/${id!}/${randomString(12)}`} />;
};

export const LiveDrawPage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const { id, sid } = useParams<{ id: string; sid: string }>();
    const [file, setFile] = useState<FileModel | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const brushWidthSliderRef = useRef<HTMLInputElement>(null);
    const managerRef = useRef<LiveDrawManager | undefined>(undefined);
    const [brushWidth, setBrushWidth] = useState(10);

    const fileName = file ? file.name : `ID_${id!}`;

    useEffect(() => {
        FileModel.getById(id!, apiAccessor).then(setFile, logError);
    }, [id, apiAccessor]);

    const getFileName = useCallback(() => {
        return `${fileName}-edit.png`;
    }, [fileName]);

    const selectBrush = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        managerRef.current?.setBrush(e.target.value);
    }, []);

    const selectBrushWidth = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = Number.parseInt(e.target.value, 10);
        managerRef.current?.setBrushWidth(v);
        setBrushWidth(v);
    }, []);

    const downloadImage = useCallback(() => {
        const data = canvasRef.current!.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = getFileName();
        link.href = data;
        document.body.append(link);
        link.click();
        link.remove();
    }, [getFileName]);

    const saveImage = useCallback(() => {
        canvasRef.current!.toBlob((blob) => {
            const namedBlob = blob as BlobWithName;
            namedBlob.name = getFileName();
            uploadFile(namedBlob).catch(logError);
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

            <div id="live-draw-wrapper">
                <canvas id="live-draw" ref={canvasRef} />
            </div>

            <canvas id="live-draw-background" ref={backgroundCanvasRef} />
            <canvas id="live-draw-foreground" ref={foregroundCanvasRef} />

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
                    <input id="live-draw-text-input" placeholder="draw text" type="text" />
                    <input defaultValue="Verdana" id="live-draw-font-input" placeholder="font" type="text" />
                    <br />
                    <RangeSlider
                        id="brush-width-slider"
                        max={200}
                        min={1}
                        onChange={selectBrushWidth}
                        ref={brushWidthSliderRef}
                        step={0.1}
                        value={brushWidth}
                    />
                    <br />
                    <div id="color-selector">
                        <svg id="color-selector-inner" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <line x1="0" x2="10" y1="5" y2="5" />
                            <line x1="5" x2="5" y1="0" y2="10" />
                        </svg>
                    </div>
                    <div id="saturation-selector">
                        <div id="saturation-selector-inner" />
                    </div>
                    <div id="opacity-selector">
                        <div id="opacity-selector-inner" />
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Utils</legend>
                    <Button onClick={saveImage} variant="primary">
                        Save Image
                    </Button>

                    <Button onClick={downloadImage} variant="secondary">
                        Download
                    </Button>
                </fieldset>
            </div>
        </>
    );
};

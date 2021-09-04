import '../../resources/livedraw.css';

import { BlobWithName, uploadFile } from '../../utils/file_uploader';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';

import { FileModel } from '../../models/file';
import { LiveDrawManager } from './manager';
import { randomString } from '../../utils/random';

export const LiveDrawRedirectPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return <Redirect to={`/livedraw/${id}/${randomString(12)}`} />;
};

export const LiveDrawPage: React.FC = () => {
    const { id, sid } = useParams<{ id: string; sid: string }>();
    const [file, setFile] = useState<FileModel | undefined>(undefined);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const foregroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
    const brushWidthSliderRef = useRef<HTMLInputElement>(null);
    const managerRef = useRef<LiveDrawManager | undefined>(undefined);

    const fileName = file ? file.name : `ID_${id}`;

    useEffect(() => {
        FileModel.getById(id).then(setFile, console.error);
    }, [id]);

    const getFileName = useCallback(() => {
        return `${fileName}-edit.png`;
    }, [fileName]);

    const selectBrush = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        managerRef.current?.setBrush(e.target.value);
    }, []);

    const selectBrushWidth = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        managerRef.current?.setBrushWidth(parseInt(e.target.value, 10));
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
            brushWidthSliderRef.current!,
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

        managerRef.current!.setup(file, sid);
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
                    <select defaultValue="brush" onChange={selectBrush}>
                        <option>rectangle</option>
                        <option>circle</option>
                        <option>brush</option>
                        <option>erase</option>
                        <option>line</option>
                        <option>restore</option>
                        <option>polygon</option>
                    </select>
                    <input id="live-draw-text-input" type="text" placeholder="drawtext" />
                    <input id="live-draw-font-input" type="text" defaultValue="Verdana" placeholder="font" />
                    <br />
                    <span>0</span>
                    <input
                        id="brush-width-slider"
                        ref={brushWidthSliderRef}
                        type="range"
                        value="10"
                        min="1"
                        max="200"
                        step="0.1"
                        onChange={selectBrushWidth}
                    />
                    <span id="brush-width-slider-max">200</span>
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
                    <input type="button" value="Save Image" onClick={saveImage} />
                    <input type="button" value="Download" onClick={downloadImage} />
                </fieldset>
            </div>
        </>
    );
};

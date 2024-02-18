import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import React, { useEffect, useRef } from 'react';

interface PDFViewerProps {
    readonly document: string;
    readonly className: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = (props) => {
    const { document, className } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        void (async () => {
            GlobalWorkerOptions.workerSrc = '/static/pdf.worker.min.mjs';
            const pdf = await getDocument(document).promise;

            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });

            // Prepare canvas using PDF page dimensions.
            const canvas = canvasRef.current!;
            const canvasContext = canvas.getContext('2d')!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context.
            const renderContext = { canvasContext, viewport };
            page.render(renderContext);
        })();
    }, [document]);

    return <canvas className={className} ref={canvasRef} />;
};

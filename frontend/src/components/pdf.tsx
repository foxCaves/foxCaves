/* eslint-disable @cspell/spellchecker */
import PSPDFKit from 'pspdfkit';
import React, { useEffect, useRef } from 'react';

interface PDFViewerProps {
    readonly document: string;
    readonly className: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = (props) => {
    const { document, className } = props;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        let pspdfKitInstance: typeof PSPDFKit | undefined;

        void (async function loadPSPDFKit() {
            pspdfKitInstance = (await import('pspdfkit')) as unknown as typeof PSPDFKit;
            pspdfKitInstance.unload(container);

            await pspdfKitInstance.load({
                // Container where PSPDFKit should be mounted.
                container: container!,
                // The document to open.
                document,
            });
        })();

        return () => {
            if (pspdfKitInstance) {
                pspdfKitInstance.unload(container);
            }
        };
    }, [document]);

    return <div className={className} ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};

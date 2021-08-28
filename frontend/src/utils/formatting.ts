const sizePostFixes = [
    ' B',
    ' kB',
    ' MB',
    ' GB',
    ' TB',
    ' PB',
    ' EB',
    ' ZB',
    ' YB',
];

export function formatDate(d: Date) {
    return d.toISOString();
}

export function formatSize(size: number) {
    let sinc = 0;

    while (size > 1024) {
        sinc = sinc + 1;
        size = size / 1024;
        if (sinc === 8) {
            break;
        }
    }

    size = Math.ceil(size * 100.0) / 100.0;

    return size + sizePostFixes[sinc]!;
}

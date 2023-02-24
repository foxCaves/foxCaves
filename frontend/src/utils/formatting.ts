const sizePostFixes = [' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB'];

export function formatDate(d: Date): string {
    return d.toISOString();
}

export function formatSize(size: number): string {
    let magnitude = 0;

    while (size > 1024) {
        magnitude += 1;
        size /= 1024;
        if (magnitude === 8) {
            break;
        }
    }

    size = Math.ceil(size * 100) / 100;

    const suffix = sizePostFixes[magnitude];
    if (!suffix) {
        return 'Insanely large';
    }

    return `${size}${suffix}`;
}

export function formatSizeWithInfinite(size: number): string {
    if (size < 0) {
        return '\u221E';
    }

    return formatSize(size);
}

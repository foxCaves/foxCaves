declare module 'content-replace-webpack-plugin' {
    class ContentReplacePlugin {
        public constructor(options: {
            external?: string[];
            chunks?: string[];
            rules: Record<string, (content: string) => string>;
        });

        public apply(compiler: unknown): void;
    }

    // eslint-disable-next-line import/no-unused-modules, import/no-default-export
    export default ContentReplacePlugin;
}

export interface Config {
    readonly no_render?: boolean;
    readonly sentry: {
        readonly dsn?: string;
    };
    readonly captcha: {
        readonly registration: boolean;
        readonly login: boolean;
        readonly forgot_password: boolean;
        readonly resend_activation: boolean;
    };
    readonly totp: {
        readonly secret_bytes: number;
        readonly issuer: string;
    };
    readonly url: {
        readonly app: string;
        readonly cdn: string;
    };
    readonly backend_revision: boolean;
    readonly admin_email: string;
}

declare const FOXCAVES_CONFIG: Config;
export const config = FOXCAVES_CONFIG;

declare const GIT_REVISION: string;
export const frontendRevision = GIT_REVISION;

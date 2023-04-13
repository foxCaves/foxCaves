export interface Config {
    readonly sentry: {
        readonly dsn?: string;
    };
    readonly captcha: {
        readonly registration: boolean;
        readonly login: boolean;
        readonly forgot_password: boolean;
        readonly resend_activation: boolean;
        readonly recaptcha_site_key: string;
    };
}

declare const FOXCAVES_CONFIG: Config;
export const config = FOXCAVES_CONFIG;

declare const GIT_REVISION: string;
export const revision = GIT_REVISION;

export interface FoxCavesConfig {
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

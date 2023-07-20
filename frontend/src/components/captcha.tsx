import React, { useCallback, useEffect, useRef } from 'react';
import Reaptcha from 'reaptcha';
import { config, Config } from '../utils/config';
import { logError } from '../utils/misc';

interface CustomRouteHandlerOptions {
    readonly page: keyof Config['captcha'];
    readonly onVerifyChanged: (response: string) => void;
    readonly resetFactor: unknown;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onVerifyChanged, resetFactor }) => {
    const captchaRef = useRef<Reaptcha>(null);

    const setNotVerified = useCallback(() => {
        onVerifyChanged('');
    }, [onVerifyChanged]);

    const enabled = config.captcha[page];

    useEffect(() => {
        if (!enabled) {
            onVerifyChanged('disabled');
            return;
        }

        captchaRef.current?.reset().catch(logError);
    }, [resetFactor, enabled, onVerifyChanged]);

    if (!enabled) {
        return null;
    }

    return (
        <Reaptcha
            onExpire={setNotVerified}
            onVerify={onVerifyChanged}
            ref={captchaRef}
            sitekey={config.captcha.recaptcha_site_key}
            size="normal"
            theme="dark"
        />
    );
};

import React, { useCallback, useEffect, useRef } from 'react';
import Reaptcha from 'reaptcha';
import { config, Config } from '../utils/config';
import { logError } from '../utils/misc';

interface CustomRouteHandlerOptions {
    page: keyof Config['captcha'];
    onVerifyChanged: (response: string) => void;
    resetFactor: unknown;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onVerifyChanged, resetFactor }) => {
    const captchaRef = useRef<Reaptcha>(null);

    const setNotVerified = useCallback(() => {
        onVerifyChanged('');
    }, [onVerifyChanged]);

    const enabled = config.captcha[page];

    useEffect(() => {
        if (enabled) {
            return;
        }

        onVerifyChanged('disabled');
    }, [enabled, onVerifyChanged]);

    useEffect(() => {
        if (resetFactor) {
            captchaRef.current?.reset().catch(logError);
        }
    }, [resetFactor]);

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

import React, { useCallback, useEffect } from 'react';
import Reaptcha from 'reaptcha';
import { config, Config } from '../utils/config';

interface CustomRouteHandlerOptions {
    page: keyof Config['captcha'];
    onVerifyChanged: (response: string) => void;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onVerifyChanged }) => {
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

    if (!enabled) {
        return null;
    }

    return (
        <Reaptcha
            onExpire={setNotVerified}
            onVerify={onVerifyChanged}
            sitekey={config.captcha.recaptcha_site_key}
            size="normal"
            theme="dark"
        />
    );
};

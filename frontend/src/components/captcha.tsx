import React, { useCallback, useEffect } from 'react';
import Reaptcha from 'reaptcha';
import { FoxCavesConfig } from '../utils/config';

interface CustomRouteHandlerOptions {
    page: keyof FoxCavesConfig['captcha'];
    onVerifyChanged: (response: string) => void;
}

declare const foxcavesConfig: FoxCavesConfig;

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onVerifyChanged }) => {
    const setNotVerified = useCallback(() => {
        onVerifyChanged('');
    }, [onVerifyChanged]);

    const enabled = !!foxcavesConfig.captcha[page];

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
            sitekey={foxcavesConfig.captcha.recaptcha_site_key}
            size="normal"
            theme="dark"
        />
    );
};

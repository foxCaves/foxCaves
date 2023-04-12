import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/context';
import { logError } from '../utils/misc';

interface CustomRouteHandlerOptions {
    page: keyof CaptchaConfig;
}

interface CaptchaConfig {
    registration: boolean;
    login: boolean;
    forgot_password: boolean;
    resend_activation: boolean;
    recaptcha_site_key: string;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page }) => {
    const { apiAccessor } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [captchaData, setCaptchaData] = useState<CaptchaConfig | undefined>(undefined);

    useEffect(() => {
        if (loading || captchaData) {
            return;
        }

        setLoading(true);

        apiAccessor.fetch('/api/v1/system/captcha').then((data: unknown) => {
            setCaptchaData(data as CaptchaConfig);
            setLoading(false);
        }, logError);
    }, [apiAccessor, loading, captchaData, setLoading, setCaptchaData]);

    if (!captchaData) {
        return <p>Loading...</p>;
    }

    return <p>{captchaData[page]}</p>;
};

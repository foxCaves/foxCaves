import React, { useCallback, useEffect, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { config, Config } from '../utils/config';
import { logError } from '../utils/misc';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import { useInputFieldSetter } from '../utils/hooks';

interface CustomRouteHandlerOptions {
    readonly page: keyof Config['captcha'];
    readonly onParamChange: (params: { [key: string]: string; } ) => void;
    readonly resetFactor: unknown;
}

interface CaptchaResponse {
    time: number;
    id: string;
    token: string;
    image: string;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onParamChange, resetFactor }) => {
    const { apiAccessor } = useContext(AppContext);
    const [dataLoading, setDataLoading] = useState(false);
    const [data, setData] = useState<CaptchaResponse | undefined>();

    const onResponseChangeCallback = useCallback((response: string) => {
        if (!data) {
            return;
        }
        onParamChange({
            captchaResponse: response,
            captchaTime: data.time.toString(),
            captchaId: data.id,
            captchaToken: data.token,
        });
    }, [data, onParamChange]);

    const [response, setResponse] = useInputFieldSetter('', onResponseChangeCallback);

    const setReload = useCallback(() => {
        setData(undefined);
    }, [setData]);

    const enabled = config.captcha[page];

    useEffect(() => {
        if (!enabled) {
            onParamChange({});
            return;
        }
    }, [resetFactor, enabled, onParamChange]);

    useEffect(() => {
        if (dataLoading || data || !enabled) {
            return;
        }

        setDataLoading(true);

        apiAccessor.fetch('/api/v1/system/captcha', {
                method: 'POST',
                data: {
                    page,
                },
            })
            .then((newData) => {
                setData(newData as CaptchaResponse);
                setDataLoading(false);
            })
            .catch(logError);
    }, [resetFactor, enabled, data, dataLoading]);

    if (!enabled) {
        return null;
    }

    return (
        <FloatingLabel className="mb-3" label="CAPTCHA">
            <Button onClick={setReload}>Reload</Button>
            {data ? <img alt="CAPTCHA" src={data?.image} /> : <h3>Loading image...</h3>},
            <Form.Control
                name="response"
                onChange={setResponse}
                placeholder=""
                required
                type="text"
                value={response}
                disabled={!data}
            />
        </FloatingLabel>
    );
};

import React, { useCallback, useContext, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import { config, Config } from '../utils/config';
import { AppContext } from '../utils/context';
import { useInputFieldSetter } from '../utils/hooks';
import { logError } from '../utils/misc';

interface CustomRouteHandlerOptions {
    readonly page: keyof Config['captcha'];
    readonly onParamChange: (params: Record<string, string>) => void;
    readonly resetFactor: unknown;
}

interface CaptchaResponse {
    ok: boolean;
    time: number;
    id: string;
    token: string;
    image: string;
}

const invalidCaptchaResponse = {
    ok: false,
    time: 0,
    id: '',
    token: '',
    image: '',
};

function makeCaptchaImage(data: CaptchaResponse | undefined, dataLoading: boolean) {
    if (data?.image) {
        return <img alt="CAPTCHA" src={data.image} />;
    }

    if (dataLoading) {
        return <h3>Loading</h3>;
    }

    return <h3>Error! Click refresh</h3>;
}

export const CaptchaContainer: React.FC<CustomRouteHandlerOptions> = ({ page, onParamChange, resetFactor }) => {
    const enabled = config.captcha[page];

    const { apiAccessor } = useContext(AppContext);
    const [dataLoading, setDataLoading] = useState(false);
    const [data, setData] = useState<CaptchaResponse | undefined>();

    const onResponseChangeCallback = useCallback(
        (response: string) => {
            if (!data) {
                return;
            }

            onParamChange({
                captchaResponse: response,
                captchaTime: data.time.toString(),
                captchaId: data.id,
                captchaToken: data.token,
            });
        },
        [data, onParamChange],
    );

    const [response, setResponse, setResponseText] = useInputFieldSetter('', onResponseChangeCallback);

    const setReload = useCallback(() => {
        if (!enabled) {
            onParamChange({
                captchaResponse: 'disabled',
            });

            return;
        }

        setResponseText('');
        onParamChange({});
        setData(undefined);
    }, [enabled, setData, onParamChange, setResponseText]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setReload();
    }, [resetFactor, setReload]);

    useEffect(() => {
        if (!enabled) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setReload();
        }
    }, [enabled, setReload]);

    useEffect(() => {
        if (dataLoading || !!data) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDataLoading(true);

        apiAccessor
            .fetch(`/api/v1/system/captcha/${page}`, {
                method: 'POST',
            })
            .then((newData) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                setData(newData as CaptchaResponse);
                setDataLoading(false);
            })
            .catch((error: unknown) => {
                logError(error);
                setData(invalidCaptchaResponse);
                setDataLoading(false);
            });
    }, [resetFactor, enabled, data, dataLoading, apiAccessor, setDataLoading, page]);

    if (!enabled) {
        return null;
    }

    return (
        <Row>
            <Col md="auto">{makeCaptchaImage(data, dataLoading)}</Col>
            <Col md="auto">
                <Button onClick={setReload}>Reload</Button>
            </Col>
            <Col>
                <FloatingLabel className="w-100" label="Enter the characters you see">
                    <Form.Control
                        disabled={!data}
                        name="response"
                        onChange={setResponse}
                        placeholder=""
                        required
                        type="text"
                        value={response}
                    />
                </FloatingLabel>
            </Col>
        </Row>
    );
};

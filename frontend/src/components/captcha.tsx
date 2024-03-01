import React, { useCallback, useEffect, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { config, Config } from '../utils/config';
import { logError } from '../utils/misc';
import { AppContext } from '../utils/context';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Form from 'react-bootstrap/Form';

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

    const [response, setResponseInt] = useState('');
    const setResponse = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const v = event.currentTarget.value;
        setResponseInt(v);
        onResponseChangeCallback(v);
    }, [setResponseInt, onResponseChangeCallback]);

    const setReload = useCallback(() => {
        setResponseInt('');
        onParamChange({});
        setData(undefined);
    }, [setData]);

    const enabled = config.captcha[page];

    useEffect(() => {
        setReload();
    }, [resetFactor]);

    useEffect(() => {
        if (!enabled) {
            setReload();
        }
    }, [onParamChange, enabled]);

    useEffect(() => {
        if (dataLoading || data || !enabled) {
            return;
        }

        setDataLoading(true);

        apiAccessor.fetch(`/api/v1/system/captcha/${page}`, {
            method: 'POST',
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
        <Row>
            <Col md='auto'>
                {data ? <img alt='CAPTCHA' src={data?.image} /> : <>Loading</>},
            </Col>
            <Col md='auto'>
                <Button onClick={setReload}>Reload</Button>
            </Col>
            <Col>
                <FloatingLabel className='w-100' label="Enter the characters you see">
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
            </Col>
        </Row>
    );
};

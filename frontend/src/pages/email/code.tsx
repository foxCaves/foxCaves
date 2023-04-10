import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../utils/context';
import { logError } from '../../utils/misc';

export const EmailCodePage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Processing...');

    const sendCode = useCallback(async () => {
        try {
            const res = (await apiAccessor.fetch('/api/v1/users/emails/code', {
                method: 'POST',
                data: { code },
            })) as { action: string };

            switch (res.action) {
                case 'forgot_password':
                    setStatus('E-Mail with new temporary password sent!');
                    break;
                case 'activation':
                    setStatus('Account activated!');
                    break;
                default:
                    setStatus('Done!');
                    break;
            }
        } catch (error: unknown) {
            setStatus(`Error: ${(error as Error).message}`);
        }
    }, [code, apiAccessor]);

    useEffect(() => {
        if (loading) {
            return;
        }

        setLoading(true);
        sendCode().catch(logError);
    }, [loading, sendCode]);

    return (
        <>
            <h1>E-Mail code</h1>
            <br />
            <h3>{status}</h3>
        </>
    );
};

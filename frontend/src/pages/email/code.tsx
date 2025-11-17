import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AppContext } from '../../utils/context';
import { logError } from '../../utils/misc';

export const EmailCodePage: React.FC = () => {
    const { apiAccessor } = useContext(AppContext);
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Processing...');

    const sendCode = useCallback(async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            setStatus(`Error: ${(error as Error).message}`);
        }
    }, [code, apiAccessor]);

    useEffect(() => {
        if (loading) {
            return;
        }

        // eslint-disable-next-line react-hooks/set-state-in-effect
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

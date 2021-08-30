import React, { useState } from 'react';
import { useCallback } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAPI } from '../../utils/api';

export const EmailCodePage: React.FC = () => {
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('Processing...');

    const sendCode = useCallback(async () => {
        try {
            const res = await fetchAPI('/api/v1/users/emails/code', {
                method: 'POST',
                data: { code },
            });

            switch (res.action) {
                case 'forgotpwd':
                    setStatus('E-Mail with new temporary password sent!');
                    break;
                case 'activation':
                    setStatus('Account activated!');
                    break;
                default:
                    setStatus('Done!');
                    break;
            }
        } catch (err: any) {
            setStatus(`Error: ${err.message}`);
        }
    }, [code]);

    useEffect(() => {
        if (loading) {
            return;
        }
        setLoading(true);
        sendCode();
    }, [loading, sendCode]);

    return (
        <>
            <h1>E-Mail code</h1>
            <br />
            <h3>{status}</h3>
        </>
    );
};

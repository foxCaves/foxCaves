import React, { useContext } from 'react';
import { AppContext } from '../utils/context';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { formatSize, formatSizeWithInfinite } from './formatting';

export const StorageUseBar: React.FC = () => {
    const { user } = useContext(AppContext);
    if (!user) {
        return null;
    }

    const nowPerc =
        user.storage_quota < 0
            ? 0
            : Math.round((user.storage_used / user.storage_quota) * 100);

    return (
        <ProgressBar className="position-relative">
            <ProgressBar now={nowPerc} />
            <div className="justify-content-center d-flex position-absolute w-100">{`${formatSize(
                user.storage_used,
            )} / ${formatSizeWithInfinite(user.storage_quota)}`}</div>
        </ProgressBar>
    );
};

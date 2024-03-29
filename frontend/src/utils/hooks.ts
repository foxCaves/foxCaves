import React, { useCallback, useState } from 'react';

export function useInputFieldSetter(
    defaultValue: string,
    callback?: (value: string) => void,
): [string, (event: React.ChangeEvent<HTMLInputElement>) => void, (value: string) => void] {
    const [value, setValue] = useState(defaultValue);
    const setter = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setValue(event.currentTarget.value);
            if (callback) {
                callback(event.currentTarget.value);
            }
        },
        [callback],
    );

    return [value, setter, setValue];
}

export function useCheckboxFieldSetter(
    defaultValue: boolean,
): [boolean, (event: React.ChangeEvent<HTMLInputElement>) => void, (value: boolean) => void] {
    const [value, setValue] = useState(defaultValue);
    const setter = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.checked);
    }, []);

    return [value, setter, setValue];
}

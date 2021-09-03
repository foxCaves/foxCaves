import React, { ReactNode } from 'react';

import { UserDetailsModel } from '../models/user';

export interface AlertClass {
    id: string;
    contents: ReactNode;
    variant: string;
    timeout: number;
    __timeout?: NodeJS.Timeout;
}

export interface AppContextClass {
    user?: UserDetailsModel;
    setUser(user: UserDetailsModel): void;
    userLoaded: boolean;
    refreshUser(): Promise<void>;
}

export const AppContext = React.createContext<AppContextClass>({} as AppContextClass);

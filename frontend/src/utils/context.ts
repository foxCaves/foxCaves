import React from 'react';
import { UserDetailsModel } from '../models/user';
import { APIAccessor } from './api';

export interface AppContextData {
    user?: UserDetailsModel;
    userLoaded: boolean;
    setUser: (user?: UserDetailsModel) => void;
    refreshUser: () => Promise<void>;
    apiAccessor: APIAccessor;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const AppContext = React.createContext<AppContextData>({} as AppContextData);

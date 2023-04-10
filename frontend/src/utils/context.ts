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

export const AppContext = React.createContext<AppContextData>({} as AppContextData);

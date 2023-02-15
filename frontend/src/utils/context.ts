import React from 'react';
import { UserDetailsModel } from '../models/user';

export interface AppContextData {
    user?: UserDetailsModel;
    userLoaded: boolean;
    setUser: (user?: UserDetailsModel) => void;
    refreshUser: () => Promise<void>;
}

export const AppContext = React.createContext<AppContextData>({} as AppContextData);

import React from 'react';
import { User } from '../models/user';

export interface AppContextClass {
    user?: User;
    userLoaded: boolean;
    showAlert(message: string, variant: string): void;
    refreshUser(): Promise<void>;
}

export const AppContext = React.createContext<AppContextClass>({} as AppContextClass);

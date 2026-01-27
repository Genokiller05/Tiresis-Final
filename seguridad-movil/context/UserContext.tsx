
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Guard } from '../types/supabase';

interface UserContextType {
    user: Guard | null;
    login: (userData: Guard) => void;
    logout: () => void;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Guard | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const login = (userData: Guard) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

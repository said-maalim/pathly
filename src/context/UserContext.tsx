/**
 * UserContext
 *
 * Provides auth state (userData / setUserData) to the entire component tree.
 * This replaces the useState held on App and allows any route to read user data
 * without prop drilling.
 */
import { createContext, useContext, useState } from 'react';

export interface UserData {
    // Supabase session shape — allow any extra fields
    data?: {
        user?: { id?: string; user_metadata?: { name?: string } };
        session?: { access_token?: string };
    };
    session?: { access_token?: string };
    [key: string]: unknown;
}

interface UserContextValue {
    userData: UserData | null;
    setUserData: (user: UserData | null) => void;
}

const UserContext = createContext<UserContextValue>({
    userData: null,
    setUserData: () => { },
});

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<UserData | null>(null);

    return (
        <UserContext.Provider value={{ userData, setUserData }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}

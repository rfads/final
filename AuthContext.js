import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../FireBaseServer';
import { onAuthStateChanged } from 'firebase/auth';

// Create the AuthContext
const AuthContext = createContext();

// AuthProvider component
export function AuthProvider({ children }) {
    const [loggedInUser, setLoggedInUser] = useState(null);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user);
            setLoggedInUser(user);
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    const login = (userData) => {
        setLoggedInUser(userData);
    };

    const logout = async () => {
        try {
            await auth.signOut();
            setLoggedInUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ loggedInUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
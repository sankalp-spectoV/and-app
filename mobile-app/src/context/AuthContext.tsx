import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { RootState } from '../store';
import { loginUser, setBiometricEnabled } from '../store/slices/authSlice';
import { AuthService } from '../services/auth';

interface AuthContextType {
  isInitialized: boolean;
  checkBiometricSupport: () => Promise<any>;
  enableBiometric: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for stored session
      const sessionToken = await SecureStore.getItemAsync('sessionToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userEmail = await SecureStore.getItemAsync('userEmail');

      if (sessionToken && refreshToken && userEmail) {
        // Try to refresh the session
        try {
          await AuthService.refreshToken(refreshToken);
          // If successful, the tokens are already updated in the service
        } catch (error) {
          // If refresh fails, clear stored tokens
          await AuthService.logout();
        }
      }

      // Check biometric support
      const biometricSupport = await AuthService.checkBiometricSupport();
      dispatch(setBiometricEnabled(biometricSupport.isAvailable));

    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitialized(true);
    }
  };

  const checkBiometricSupport = async () => {
    return await AuthService.checkBiometricSupport();
  };

  const enableBiometric = async () => {
    const support = await AuthService.checkBiometricSupport();
    if (support.isAvailable) {
      dispatch(setBiometricEnabled(true));
    } else {
      throw new Error('Biometric authentication not available');
    }
  };

  const value = {
    isInitialized,
    checkBiometricSupport,
    enableBiometric,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
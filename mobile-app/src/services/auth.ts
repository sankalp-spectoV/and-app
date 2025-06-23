import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiService } from './api';

export class AuthService {
  static async getDeviceInfo() {
    return {
      deviceId: await Device.getDeviceTypeAsync() + '_' + Math.random().toString(36).substr(2, 9),
      deviceType: Platform.OS,
      deviceName: Device.deviceName || `${Platform.OS} Device`,
      appVersion: '1.0.0',
      osVersion: Device.osVersion,
    };
  }

  static async login(credentials: { email: string; password: string; deviceInfo?: any }) {
    const deviceInfo = credentials.deviceInfo || await this.getDeviceInfo();
    
    const response = await apiService.post('/api/mobile/auth/login', {
      ...credentials,
      ...deviceInfo,
    }, false);

    // Store tokens securely
    await SecureStore.setItemAsync('sessionToken', response.data.tokens.sessionToken);
    await SecureStore.setItemAsync('refreshToken', response.data.tokens.refreshToken);
    await SecureStore.setItemAsync('userEmail', credentials.email);
    
    // Set token in API service
    await apiService.setSessionToken(response.data.tokens.sessionToken);

    return response.data;
  }

  static async register(userData: { name: string; email: string; phone: string; password: string }) {
    return await apiService.post('/api/register', userData, false);
  }

  static async verifyRegistration(data: { email: string; otp: string }) {
    return await apiService.post('/api/verify-registration', data, false);
  }

  static async refreshToken(refreshToken: string) {
    const response = await apiService.post('/api/mobile/auth/refresh', {
      refreshToken,
    }, false);

    // Update stored token
    await SecureStore.setItemAsync('sessionToken', response.data.sessionToken);
    await apiService.setSessionToken(response.data.sessionToken);

    return response.data;
  }

  static async logout() {
    // Clear stored tokens
    await SecureStore.deleteItemAsync('sessionToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userEmail');
    
    // Clear API service token
    await apiService.clearSessionToken();
  }

  static async biometricLogin() {
    // Check if biometric authentication is available
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      throw new Error('Biometric authentication not available');
    }

    // Authenticate with biometrics
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your account',
      cancelLabel: 'Cancel',
      fallbackLabel: 'Use Password',
    });

    if (!result.success) {
      throw new Error('Biometric authentication failed');
    }

    // Get stored credentials
    const email = await SecureStore.getItemAsync('userEmail');
    const refreshToken = await SecureStore.getItemAsync('refreshToken');

    if (!email || !refreshToken) {
      throw new Error('No stored credentials found');
    }

    // Refresh session
    return await this.refreshToken(refreshToken);
  }

  static async forgotPassword(email: string) {
    return await apiService.post('/api/forgot-password', { email }, false);
  }

  static async verifyOTP(email: string, otp: string) {
    return await apiService.post('/api/verify-otp', { email, otp }, false);
  }

  static async resetPassword(email: string, otp: string, password: string) {
    return await apiService.post('/api/reset-password', { email, otp, password }, false);
  }

  static async checkBiometricSupport() {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
      isAvailable: hasHardware && isEnrolled,
    };
  }
}
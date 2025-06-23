import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:5000' 
    : 'http://localhost:5000'
  : 'https://your-production-api.com';

class ApiService {
  private baseURL: string;
  private sessionToken: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.initializeToken();
  }

  private async initializeToken() {
    try {
      this.sessionToken = await AsyncStorage.getItem('sessionToken');
    } catch (error) {
      console.error('Failed to load session token:', error);
    }
  }

  private async getHeaders(includeAuth: boolean = true): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': `SankalpApp/${Device.osVersion} (${Platform.OS})`,
    };

    if (includeAuth && this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    // Handle mobile API response format
    if (data.success !== undefined) {
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      return data.data || data;
    }

    return data;
  }

  async setSessionToken(token: string) {
    this.sessionToken = token;
    await AsyncStorage.setItem('sessionToken', token);
  }

  async clearSessionToken() {
    this.sessionToken = null;
    await AsyncStorage.removeItem('sessionToken');
  }

  // Generic request method
  async request(
    endpoint: string, 
    options: RequestInit = {}, 
    includeAuth: boolean = true
  ) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders(includeAuth);

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // HTTP methods
  async get(endpoint: string, includeAuth: boolean = true) {
    return this.request(endpoint, { method: 'GET' }, includeAuth);
  }

  async post(endpoint: string, data: any, includeAuth: boolean = true) {
    return this.request(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async put(endpoint: string, data: any, includeAuth: boolean = true) {
    return this.request(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      includeAuth
    );
  }

  async delete(endpoint: string, includeAuth: boolean = true) {
    return this.request(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // Batch requests for mobile optimization
  async batchRequest(requests: Array<{ id: string; type: string; [key: string]: any }>) {
    return this.post('/api/mobile/batch', { requests });
  }
}

export const apiService = new ApiService();
import { BACKEND_API_URL } from './constants';
import { Alert } from 'react-native';

export const testBackendConnection = async () => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      console.log('✅ Backend is reachable');
      return true;
    }
    throw new Error('Backend responded with error');
  } catch (error) {
    console.error('❌ Backend unreachable:', error);
    Alert.alert(
      'Backend Not Connected',
      `The API server at ${BACKEND_API_URL} is not running.\n\nPlease:\n1. Start your backend server\n2. Verify IP address in constants.js\n3. Ensure device is on same Wi-Fi`
    );
    return false;
  }
};
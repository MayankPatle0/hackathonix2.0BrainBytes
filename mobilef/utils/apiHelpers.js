export const handleNetworkError = (error) => {
  if (error.message.includes('Network request failed')) {
    Alert.alert(
      'Network Error',
      'Cannot connect to backend server. Please ensure:\n1. Backend is running\n2. IP address is correct\n3. Device is on same Wi-Fi'
    );
  } else {
    Alert.alert('Error', error.message);
  }
};
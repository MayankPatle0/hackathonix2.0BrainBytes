// mobilef/hooks/useNetworkStatus.js
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Custom hook to detect network connectivity status
 * @returns {Object} { isOnline: boolean, isInternetReachable: boolean }
 */
export default function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus({
        isOnline: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      });
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return networkStatus;
}

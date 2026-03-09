import React from 'react';
import { TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ShareButton({ item }) {
  const handleShare = async () => {
    // Ensure item is not null/undefined
    if (!item) {
      Alert.alert('Error', 'Cannot share empty item');
      return;
    }

    try {
      const message = `${item.title || 'No Title'}\n\n${item.summary || ''}\n\n${item.url || ''}`;
      const result = await Share.share({
        message: message,
        title: item.title || 'SnapMind Memory',
        url: item.url,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share content');
      console.error('Share error:', error);
    }
  };

  return (
    <TouchableOpacity onPress={handleShare} style={styles.button}>
      <Ionicons name="share-social-outline" size={18} color="#a1a1aa" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4, // Using the same padding as MemoryCard actions
  },
});

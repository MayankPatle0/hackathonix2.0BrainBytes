
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FRONTEND_URL } from '../utils/constants';
import { useSupabase } from '../context/SupabaseContext';

export default function SettingsScreen() {
  const { logout, memories, fetchMemories } = useSupabase();

  const openWebApp = () => {
    // For Android Emulator, localhost is 10.0.2.2
    const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';
    const webUrl = FRONTEND_URL || defaultUrl; 
    
    Linking.canOpenURL(webUrl).then(supported => {
      if (supported) {
        Linking.openURL(webUrl);
      } else {
        // Fallback or error handling
        if (webUrl.includes('nexus://')) {
           Alert.alert('Info', 'Opening deep link...');
        } else {
           Alert.alert('Error', `Cannot open URL: ${webUrl}`);
        }
      }
    }).catch(err => console.error("An error occurred", err));
  };

  const handleRefresh = async () => {
    Alert.alert('Syncing', 'Refreshing data...');
    try {
      await fetchMemories();
      Alert.alert('Success', 'Data synced successfully!');
    } catch (error) {
      Alert.alert('Error', 'Sync failed');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Logout failed');
            }
          },
        },
      ]
    );
  };

  const favoriteCount = memories.filter(m => m.metadata?.favorite).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.card}>
          <Text style={styles.appName}>Nexus</Text>
          <Text style={styles.version}>Version 2.0.0</Text>
          <Text style={styles.description}>
            Your personal AI-powered Second Brain. Capture, organize, and visualize your knowledge graph effortlessly.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.settingItem} onPress={openWebApp}>
          <Ionicons name="globe-outline" size={20} color="#06b6d4" />
          <Text style={styles.settingText}>Open Web Dashboard</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#71717a" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleRefresh}>
          <Ionicons name="refresh-outline" size={20} color="#06b6d4" />
          <Text style={styles.settingText}>Force Sync</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={[styles.settingText, { color: '#ef4444' }]}>Logout</Text>
          <Ionicons name="chevron-forward-outline" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Stats</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Memories</Text>
            <Text style={styles.statValue}>{memories.length}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Favorites</Text>
            <Text style={styles.statValue}>{favoriteCount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        <View style={styles.card}>
          <View style={styles.privacyItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#34d399" />
            <Text style={styles.privacyText}>Data is encrypted and secure</Text>
          </View>
          <View style={styles.privacyItem}>
            <Ionicons name="sync-outline" size={20} color="#34d399" />
            <Text style={styles.privacyText}>Real-time cloud sync active</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#71717a',
    marginBottom: 12,
    paddingTop: 24,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#06b6d4',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  version: {
    fontSize: 14,
    color: '#a1a1aa',
    marginBottom: 16,
    fontWeight: '500'
  },
  description: {
    fontSize: 15,
    color: '#e4e4e7',
    lineHeight: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#fafafa',
    marginLeft: 12,
    fontWeight: '500'
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 15,
    color: '#a1a1aa',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: '#d4d4d8',
    marginLeft: 12,
  }
});

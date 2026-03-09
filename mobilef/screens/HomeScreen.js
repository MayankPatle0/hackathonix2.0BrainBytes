
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, ScrollView, StatusBar, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabase } from '../context/SupabaseContext';
import MemoryCard from '../components/MemoryCard';
import MemoryDetailModal from '../components/MemoryDetailModal';
import ChatModal from '../components/ChatModal';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '../constants/theme';

const HomeScreen = ({ navigation }) => {
  const { supabase, session, memories, fetchMemories, toggleFavorite, deleteMemory, tags } = useSupabase();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null); // For detail modal
  // Simple Pulse Animation State (using basic re-render for effect or static for performance)
  const [syncPulse, setSyncPulse] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncPulse(p => p === 1 ? 0.5 : 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchMemories();
    }
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemories().finally(() => setRefreshing(false));
  };

  const handleDeleteAnimated = useCallback(async (memoryId) => {
      Alert.alert(
        'Delete Memory',
        'Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                await deleteMemory(memoryId);
            }
          }
        ]
      );
  }, [deleteMemory]);

  const handleToggleFavorite = useCallback(async (memoryId) => {
    try {
      await toggleFavorite(memoryId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  }, [toggleFavorite]);

  const sortedMemories = [...memories].sort((a, b) => {
    const aFav = a.metadata?.favorite ? 1 : 0;
    const bFav = b.metadata?.favorite ? 1 : 0;
    if (bFav !== aFav) return bFav - aFav;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filteredMemories = selectedTag
    ? sortedMemories.filter(m => m.metadata?.keywords?.includes(selectedTag))
    : sortedMemories;

  const renderTagFilters = () => (
    <View style={styles.tagContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
        <TouchableOpacity
          style={[styles.tag, !selectedTag ? styles.tagSelected : {}]}
          onPress={() => setSelectedTag(null)}
        >
          <Text style={[styles.tagText, !selectedTag ? styles.tagTextSelected : {}]}>All</Text>
        </TouchableOpacity>
        {(tags || []).map(tag => (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, selectedTag === tag ? styles.tagSelected : {}]}
            onPress={() => setSelectedTag(tag)}
          >
            <Text style={[styles.tagText, selectedTag === tag ? styles.tagTextSelected : {}]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (!session) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.action} />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* BACKGROUND MESH EFFECT */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
         {/* Top Left Purple Blob */}
         <LinearGradient
            colors={['#A855F7', 'transparent']}
            style={[styles.blob, { top: -100, left: -100 }]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
         />
         {/* Bottom Right Cyan Blob */}
         <LinearGradient
            colors={['#06B6D4', 'transparent']}
            style={[styles.blob, { bottom: -100, right: -100 }]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 0, y: 0 }}
         />
         {/* Overall Noise/Texture Overlay (Simulated with low opacity gradient) */}
         <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a0b2e', opacity: 0.8 }]} />
      </View>
      
      <View style={styles.header}>
        <View style={styles.headerContentLeft}>
            {/* Logo Container with Glow */}
            <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Ionicons name="cube" size={32} color="#06B6D4" />
            </View>
            
            <View>
               <Text style={styles.headerTitle}>Nexus</Text>
               <Text style={styles.headerSubtitle}>AI MEMORY BANK</Text>
            </View>
        </View>

        {/* Personalized Greeting + Avatar */}
        <View style={styles.headerRight}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'} 👋
            </Text>
          </View>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.7}>
             <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{session?.user?.email?.[0]?.toUpperCase() || 'U'}</Text>
             </View>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tag Filters */}
      {renderTagFilters()}
      
      {/* Memories List */}
      <FlatList
        data={filteredMemories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MemoryCard 
            memory={item} 
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteAnimated}
            onPress={(memory) => setSelectedMemory(memory)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <View style={styles.emptyGlow} />
             <View style={styles.emptyIcon}>
                <Ionicons name="sparkles" size={32} color="#06B6D4" />
             </View>
             <Text style={styles.emptyText}>Memory Bank Empty</Text>
             <Text style={styles.emptySubtext}>Capture your first thought.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.action} />
        }
      />

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        visible={selectedMemory !== null}
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteAnimated}
      />

      {/* Floating Actions */}
      <View style={styles.fabContainer}>
        {/* Chat FAB (LOCKED) */}
        <TouchableOpacity 
          style={[styles.fab, styles.chatFab, { opacity: 0.7 }]}
          onPress={() => Alert.alert("Nexus AI", "Chat feature is coming in v2.0")}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
             <Ionicons name="sparkles" size={22} color={theme.colors.textMuted} />
             <View style={{ position: 'absolute', bottom: -8, right: -8, backgroundColor: theme.colors.card, borderRadius: 8, padding: 2 }}>
                <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
             </View>
          </View>
        </TouchableOpacity>

        {/* Add FAB */}
        <TouchableOpacity 
          style={[styles.fab, styles.addFab]}
          onPress={() => navigation.navigate('Add')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.action, theme.colors.secondary]} // Cyan -> Purple
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  blob: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent', // Let mesh show through
  },
  headerContentLeft: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12
  },
  logoContainer: {
     position: 'relative',
     width: 40,
     height: 40,
     justifyContent: 'center',
     alignItems: 'center'
  },
  logoGlow: {
     position: 'absolute',
     width: 30,
     height: 30,
     borderRadius: 15,
     backgroundColor: '#06B6D4',
     opacity: 0.3,
     transform: [{ scale: 1.5 }]
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    marginBottom: -2
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#06B6D4',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.8
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  greetingContainer: {
    alignItems: 'flex-end'
  },
  greetingText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500'
  },
  profileButton: {
    padding: 4,  // Increased from 2 for larger touch target
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  avatarPlaceholder: {
    width: 40,  // Increased from 32 for larger touch target (44x44 minimum recommended)
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardHighlight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,  // Increased from 14
    fontWeight: 'bold'
  },
  
  // LIST & EMPTY STATE
  list: {
    padding: 16,
    paddingBottom: 120, 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyGlow: {
     position: 'absolute',
     width: 100,
     height: 100,
     borderRadius: 50,
     backgroundColor: '#06B6D4',
     opacity: 0.1,
     top: 10
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#1E1B2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardHighlight
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    width: '70%',
  },
  
  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  fab: {
    width: 72,  // Increased from 64 for better touch target
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // TAGS
  chatFab: {
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.cardHighlight,
  },
  tagContainer: {
    paddingVertical: 12,
  },
  tagScroll: {
    paddingHorizontal: 24,
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#1E1B2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tagSelected: {
    backgroundColor: 'rgba(6,182,212,0.15)',
    borderColor: '#06B6D4',
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  tagTextSelected: {
    color: '#06B6D4',
  },
});

export default HomeScreen;
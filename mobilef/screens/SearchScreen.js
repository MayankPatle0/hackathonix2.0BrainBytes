// mobilef/screens/SearchScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabase } from '../context/SupabaseContext';
import MemoryCard from '../components/MemoryCard';
import MemoryDetailModal from '../components/MemoryDetailModal';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const SearchScreen = () => {
  const { memories, toggleFavorite, deleteMemory } = useSupabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null); // For detail modal
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Memoized filtered results
  const filteredMemories = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return memories;
    }

    const query = debouncedQuery.toLowerCase();
    
    return memories.filter(memory => {
      const title = memory.metadata?.title || '';
      const summary = memory.metadata?.summary || '';
      const keywords = memory.metadata?.keywords || [];
      
      return (
        title.toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query) ||
        keywords.some(k => k.toLowerCase().includes(query))
      );
    });
  }, [debouncedQuery, memories]);

  // Memoized callbacks
  const handleToggleFavorite = useCallback(async (id) => {
    await toggleFavorite(id);
  }, [toggleFavorite]);

  const handleDelete = useCallback(async (id) => {
    await deleteMemory(id);
  }, [deleteMemory]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Memories</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#a1a1aa" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, content, or tags..."
          placeholderTextColor="#52525b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#71717a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Info */}
      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {filteredMemories.length} {filteredMemories.length === 1 ? 'result' : 'results'}
        </Text>
      </View>

      {/* Results List */}
      <FlatList
        data={filteredMemories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MemoryCard
            memory={item}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDelete}
            onPress={(memory) => setSelectedMemory(memory)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#3f3f46" />
            <Text style={styles.emptyText}>
              {searchQuery ? 'No results found' : 'Start searching'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try different keywords'
                : 'Search through your memories'}
            </Text>
          </View>
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={5}
      />

      {/* Memory Detail Modal */}
      <MemoryDetailModal
        visible={selectedMemory !== null}
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fafafa',
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fafafa',
    fontSize: 16,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  resultsInfo: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  resultsText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#e4e4e7',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#71717a',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SearchScreen;
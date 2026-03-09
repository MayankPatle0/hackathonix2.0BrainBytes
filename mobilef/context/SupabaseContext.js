
import 'react-native-url-polyfill/auto';
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Alert } from 'react-native';

const SupabaseContext = createContext(null);

export const SupabaseProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memories, setMemories] = useState([]);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        if (session) fetchMemories(session.user.id);
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (session) fetchMemories(session.user.id);
        else setMemories([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchMemories = async (userId) => {
    try {
      // Updated table name
      const { data, error } = await supabase
        .from('retain_auth_memory')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert('Error', 'Could not load memories');
    }
  };

  useEffect(() => {
    if (!session) return;
    
    // Updated table name in subscription
    const channel = supabase
      .channel('public:retain_auth_memory')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'retain_auth_memory' }, () => {
        fetchMemories(session.user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Compute unique tags from all memories
  const tags = useMemo(() => {
    const allKeywords = memories.flatMap(m => m.metadata?.keywords || []);
    return [...new Set(allKeywords)];
  }, [memories]);

  const toggleFavorite = async (id) => {
    const item = memories.find(m => m.id === id);
    if (!item) return;
    
    const currentFav = item.metadata?.favorite || false;
    const newMetadata = { ...item.metadata, favorite: !currentFav };
    
    // Optimistic update
    setMemories(prev => prev.map(m => 
      m.id === id ? { ...m, metadata: newMetadata } : m
    ));

    const { error } = await supabase
      .from('retain_auth_memory')
      .update({ metadata: newMetadata })
      .eq('id', id);

    if (error) {
      // Revert on error
      setMemories(prev => prev.map(m => m.id === id ? item : m));
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const deleteMemory = async (id) => {
    const { error } = await supabase
      .from('retain_auth_memory')
      .delete()
      .eq('id', id);

    if (error) throw error;
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <SupabaseContext.Provider value={{
      supabase,
      session,
      loading,
      memories,
      tags,
      getAuthToken: () => session?.access_token,
      fetchMemories: () => session && fetchMemories(session.user.id),
      toggleFavorite,
      deleteMemory,
      logout
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => useContext(SupabaseContext);


import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSupabase } from '../context/SupabaseContext';
import { saveDataToBackend } from '../utils/shareUtils';
import { useNavigation, useRoute } from '@react-navigation/native';
import useAppShareIntent from '../hooks/useShareIntent';
import { enhanceSharedContent, formatForBackend, quickAnalyze } from '../utils/contentEnhancer';

const AddScreen = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mood, setMood] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const { session, getAuthToken } = useSupabase();
  const navigation = useNavigation();
  
  // Hook to listen for incoming shares from other apps
  const sharedText = useAppShareIntent();

  // Populate content when shared text is received
  useEffect(() => {
    if (sharedText) {
      setContent(sharedText);
      
      // Quick analysis (synchronous)
      const analysis = quickAnalyze(sharedText);
      setContentAnalysis(analysis);
      
      // Auto-populate title based on platform
      if (analysis.platform !== 'text') {
        const platformNames = {
          instagram: 'Instagram',
          youtube: 'YouTube', 
          tiktok: 'TikTok',
          twitter: 'Twitter',
          linkedin: 'LinkedIn',
          facebook: 'Facebook',
          reddit: 'Reddit',
        };
        const platformName = platformNames[analysis.platform] || 'Link';
        const typeName = analysis.type === 'reel' ? 'Reel' : 
                        analysis.type === 'short' ? 'Short' :
                        analysis.type === 'video' ? 'Video' :
                        'Content';
        setTitle(`${platformName} ${typeName}`);
      }
    }
  }, [sharedText]);

  // Re-analyze when content changes
  useEffect(() => {
    if (content) {
      const analysis = quickAnalyze(content);
      setContentAnalysis(analysis);
    } else {
      setContentAnalysis(null);
    }
  }, [content]);

  const moods = [
    { label: 'Happy', value: 'happy', icon: 'happy-outline' },
    { label: 'Sad', value: 'sad', icon: 'sad-outline' },
    { label: 'Excited', value: 'excited', icon: 'star-outline' },
    { label: 'Calm', value: 'calm', icon: 'leaf-outline' },
    { label: 'Productive', value: 'productive', icon: 'flash-outline' },
  ];

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please add a title and content');
      return;
    }

    if (!session) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setLoading(true);
    setAnalyzing(true);
    
    try {
      const token = getAuthToken();
      
      // Enhance content with platform detection and metadata
      const enhanced = await enhanceSharedContent(content, {  
        fetchMetadata: true // Fetch metadata from APIs
      });
      
      // Format for backend
      const formattedText = formatForBackend(enhanced, title, tags);
      
      // Send to backend
      await saveDataToBackend(formattedText, token);

      // 🎉 Success - Trigger confetti celebration!
      setShowConfetti(true);
      if (confettiRef.current) {
        confettiRef.current.start();
      }

      // Clear form
      setTitle('');
      setContent('');
      setTags('');
      setContentAnalysis(null);
      setAnalyzing(false);
      
      // Navigate after confetti animation
      setTimeout(() => {
        setShowConfetti(false);
        navigation.navigate('Home');
      }, 2000);

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Confetti Cannon - Positioned at top */}
      {showConfetti && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{x: -10, y: 0}}
          autoStart={true}
          fadeOut={true}
          colors={['#06B6D4', '#A855F7', '#EC4899', '#3B82F6', '#22D3EE']}
          explosionSpeed={350}
          fallSpeed={2500}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back-outline" size={24} color="#06b6d4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Memory</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {/* Platform Badge */}
        {contentAnalysis && contentAnalysis.platform !== 'text' && (
          <View style={[styles.platformBadge, { borderColor: contentAnalysis.color }]}>
            <Text style={styles.platformIcon}>{contentAnalysis.icon}</Text>
            <Text style={[styles.platformText, { color: contentAnalysis.color }]}>
              {contentAnalysis.platform.toUpperCase()} {contentAnalysis.type.toUpperCase()}
            </Text>
          </View>
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Give it a memorable title..."
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />

        <Text style={styles.label}>Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Paste a link from Instagram, TikTok, YouTube, or write your thoughts..."
          placeholderTextColor="#666"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="work, ideas, inspiration..."
          placeholderTextColor="#666"
          value={tags}
          onChangeText={setTags}
        />

        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.moodContainer}>
          {moods.map(m => (
            <TouchableOpacity
              key={m.value}
              style={[styles.moodButton, mood === m.value ? styles.moodSelected : {}]}
              onPress={() => setMood(m.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={m.icon}
                size={24}
                color={mood === m.value ? '#fff' : '#a1a1aa'}
              />
              <Text style={[styles.moodLabel, mood === m.value && styles.moodLabelSelected]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            {analyzing && (
              <Text style={styles.analyzingText}>
                ✨ Analyzing content...
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.buttonWrapper} 
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#06B6D4', '#3B82F6', '#A855F7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.buttonText}>Save Memory</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fafafa',
  },
  form: {
    padding: 20,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 2,
    marginBottom: 16,
    gap: 8,
  },
  platformIcon: {
    fontSize: 18,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fafafa',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#18181b',
    color: '#fafafa',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  textArea: {
    height: 150,
    textAlignVertical: 'top',
  },
  loaderContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 12,
    color: '#06b6d4',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: 25,
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    gap: 10,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  moodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  moodButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    width: '30%',
    marginBottom: 10,
  },
  moodSelected: {
    backgroundColor: '#06b6d4',
    borderColor: '#06b6d4',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  moodLabel: {
    color: '#a1a1aa',
    marginTop: 5,
    fontSize: 12,
  },
  moodLabelSelected: {
    color: '#ffffff',
  },
  backButton: {
    padding: 8,
  },
});

export default AddScreen;

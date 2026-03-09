import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabase } from '../context/SupabaseContext';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const { supabase } = useSupabase();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          // Check if user already exists
          if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            Alert.alert('Account Exists', 'This email is already registered. Please sign in.');
            setMode('signin');
          } else {
            throw error;
          }
        } else {
          Alert.alert(
            'Success', 
            'Check your email for confirmation link!\n\nNote: Check spam folder.\nEmail may take 2-3 minutes.',
            [{ text: 'OK' }]
          );
          setMode('signin');
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            Alert.alert('Error', 'Incorrect email or password');
          } else if (error.message.includes('Email not confirmed')) {
            Alert.alert('Email Not Confirmed', 'Please check your email and click the confirmation link first.');
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.logoContainer}>
          <Ionicons name="cube-outline" size={64} color="#06b6d4" />
        </View>
        <Text style={styles.title}>Nexus</Text>
        <Text style={styles.subtitle}>
          {mode === 'signup' ? 'Join the Network' : 'Access Your Memory'}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')} disabled={loading}>
          <Text style={styles.link}>
            {mode === 'signin' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#06b6d4',
    textAlign: 'center',
    marginBottom: 5,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#18181b',
    color: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    borderColor: '#27272a',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#06b6d4',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    color: '#34d399',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AuthScreen;
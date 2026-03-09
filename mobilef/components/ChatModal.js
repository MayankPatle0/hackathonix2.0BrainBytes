
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupabase } from '../context/SupabaseContext';
import { BACKEND_API_URL } from '../utils/constants';

export default function ChatModal({ visible, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '0', role: 'ai', text: "Hi! I'm Nexus. Ask me about your saved memories." }
  ]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  const { session } = useSupabase();

  useEffect(() => {
    if (visible && flatListRef.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [visible, messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsgText = input.trim();
    const userMsg = { id: Date.now().toString(), role: 'user', text: userMsgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Use the configured backend URL
      const response = await fetch(`${BACKEND_API_URL}/ask_nexus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ query: userMsgText })
      });

      const data = await response.json();
      
      const aiMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        text: data.answer || "I couldn't find anything relevant in your memories."
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        text: "Sorry, I'm having trouble connecting to your brain right now. Please check your connection." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#06b6d4" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="chatbubbles" size={20} color="#06b6d4" />
              <Text style={styles.headerTitle}>Ask Nexus</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Recall something..."
                placeholderTextColor="#52525b"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]} 
                onPress={handleSend}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b', // Zinc 900
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#27272a',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)', // Cyan tint
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    borderBottomLeftRadius: 4,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageText: {
    color: '#e4e4e7',
    fontSize: 15,
    lineHeight: 22,
  },
  inputWrapper: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#27272a',
    borderRadius: 24,
    padding: 6,
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    color: '#fafafa',
    maxHeight: 100,
    fontSize: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    backgroundColor: '#06b6d4',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#3f3f46',
    opacity: 0.5,
  },
});

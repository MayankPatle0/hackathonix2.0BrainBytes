import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const MemoryDetailModal = ({ visible, memory, onClose, onToggleFavorite, onDelete }) => {
  if (!memory) return null;

  const { metadata, created_at, id } = memory;
  const { title, summary, keywords, favorite, type, emotion, original_text } = metadata || {};

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        {/* Modal Content */}
        <View style={styles.modalContainer}>
          {/* Gradient Header */}
          <LinearGradient
            colors={['#1E1B2E', '#0D0B14']}
            style={styles.modalContent}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View style={styles.closeButtonInner}>
                <Ionicons name="close" size={24} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.typeRow}>
                <View style={styles.typeBadge}>
                  <Ionicons name="document-text" size={16} color="#06B6D4" />
                  <Text style={styles.typeText}>{type || 'Note'}</Text>
                </View>
                {emotion && (
                  <View style={styles.emotionBadge}>
                    <Text style={styles.emotionText}>{emotion}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.date}>{formatDate(created_at)}</Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Title */}
              <Text style={styles.title}>{title || 'Untitled Memory'}</Text>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Summary Section */}
              {summary && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    <Ionicons name="bulb-outline" size={14} color="#A855F7" /> Summary
                  </Text>
                  <Text style={styles.summaryText}>{summary}</Text>
                </View>
              )}

              {/* Original Content */}
              {original_text && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    <Ionicons name="document-text-outline" size={14} color="#06B6D4" /> Original Content
                  </Text>
                  <Text style={styles.originalText}>{original_text}</Text>
                </View>
              )}

              {/* Keywords */}
              {keywords && keywords.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    <Ionicons name="pricetag-outline" size={14} color="#EC4899" /> Keywords
                  </Text>
                  <View style={styles.tagsContainer}>
                    {keywords.map((keyword, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionBar}>
              <TouchableOpacity 
                style={[styles.actionButton, favorite && styles.actionButtonActive]}
                onPress={() => onToggleFavorite(id)}
              >
                <Ionicons 
                  name={favorite ? "heart" : "heart-outline"} 
                  size={22} 
                  color={favorite ? "#EC4899" : "#94A3B8"} 
                />
                <Text style={[styles.actionText, favorite && styles.actionTextActive]}>
                  {favorite ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#94A3B8" />
                <Text style={styles.actionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => { onDelete(id); onClose(); }}
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                <Text style={[styles.actionText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContainer: {
    maxHeight: height * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    minHeight: height * 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  typeText: {
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emotionBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  emotionText: {
    color: '#EC4899',
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    color: '#64748B',
    fontSize: 13,
  },
  scrollContent: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  summaryText: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 26,
  },
  originalText: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  tagText: {
    color: '#06B6D4',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    borderRadius: 12,
  },
  actionText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextActive: {
    color: '#EC4899',
  },
});

export default MemoryDetailModal;

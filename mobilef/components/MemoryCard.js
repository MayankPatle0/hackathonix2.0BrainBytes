
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

// Platform Icon Mapping
const getPlatformConfig = (type) => {
    const t = (type || 'text').toLowerCase();
    switch(t) {
        case 'youtube': return { icon: 'logo-youtube', color: '#EF4444', label: 'YouTube' };
        case 'twitter': return { icon: 'logo-twitter', color: '#3B82F6', label: 'Twitter' };
        case 'linkedin': return { icon: 'logo-linkedin', color: '#0A66C2', label: 'LinkedIn' };
        case 'instagram': return { icon: 'logo-instagram', color: '#E1306C', label: 'Instagram' };
        case 'github': return { icon: 'logo-github', color: '#FFFFFF', label: 'GitHub' };
        case 'article': return { icon: 'document-text', color: '#A855F7', label: 'Article' };
        default: return { icon: 'document-text-outline', color: '#94A3B8', label: 'Note' };
    }
};

const MemoryCard = ({ memory, onToggleFavorite, onDelete, onPress }) => {
  const { metadata, created_at, id } = memory;
  const { title, summary, keywords, favorite, type, emotion } = metadata || {};
  const [summaryTruncated, setSummaryTruncated] = useState(false);

  const config = getPlatformConfig(type);
  
  // Alternating Gradient Borders based on ID (deterministic)
  const borderGradients = [
      ['#A855F7', '#EC4899'], // Purple -> Pink
      ['#06B6D4', '#3B82F6'], // Cyan -> Blue
  ];
  const gradientIndex = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % borderGradients.length;
  const activeGradient = borderGradients[gradientIndex];

  return (
    <TouchableOpacity 
      style={styles.cardWrapper} 
      activeOpacity={0.85}
      onPress={() => onPress && onPress(memory)}
    >
        {/* Gradient Border Container */}
        <LinearGradient
            colors={activeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.borderGradient}
        >
            {/* Inner Content Container - FIXED HEIGHT */}
            <View style={styles.cardInner}>
                
                {/* Header: Platform & Favorite */}
                <View style={styles.header}>
                    <View style={styles.platformBadge}>
                        <Ionicons name={config.icon} size={14} color={config.color} />
                        <Text style={[styles.platformText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={(e) => { e.stopPropagation(); onToggleFavorite(id); }} 
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                         <Ionicons 
                             name={favorite ? "heart" : "heart-outline"} 
                             size={20} 
                             color={favorite ? "#EC4899" : theme.colors.textMuted} 
                         />
                    </TouchableOpacity>
                </View>

                {/* Main Content Row */}
                <View style={styles.contentRow}>
                    <View style={styles.textContent}>
                        <Text style={styles.title} numberOfLines={2}>{title || 'Untitled Memory'}</Text>
                        { summary && (
                          <Text 
                            style={styles.summary} 
                            numberOfLines={2}
                            onTextLayout={(e) => {
                              setSummaryTruncated(e.nativeEvent.lines.length >= 2);
                            }}
                          >
                            {summary}
                          </Text>
                        )}
                        {/* Read More Indicator */}
                        {summaryTruncated && (
                          <Text style={styles.readMore}>Tap to read more →</Text>
                        )}
                    </View>
                </View>

                {/* Footer: Tags & Actions */}
                <View style={styles.footer}>
                    <View style={styles.tagContainer}>
                        {(keywords || []).slice(0, 2).map((k, i) => (
                            <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>#{k}</Text>
                            </View>
                        ))}
                        {(keywords || []).length > 2 && (
                          <View style={styles.moreTag}>
                            <Text style={styles.moreTagText}>+{keywords.length - 2}</Text>
                          </View>
                        )}
                    </View>

                    <View style={styles.actions}>
                         <TouchableOpacity 
                           style={styles.actionBtn} 
                           onPress={(e) => { e.stopPropagation(); onDelete(id); }}
                         >
                             <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
                         </TouchableOpacity>
                         <TouchableOpacity style={styles.actionBtn}>
                             <Ionicons name="create-outline" size={16} color={theme.colors.textMuted} />
                         </TouchableOpacity>
                    </View>
                </View>

                 {/* Decorative Glow */}
                <View style={[styles.glow, { backgroundColor: activeGradient[0] }]} />
            </View>
        </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
    // Enhanced Premium Shadows
    shadowColor: "#A855F7", // Purple-tinted shadow for brand consistency
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  borderGradient: {
    padding: 1.5, // Border width
    borderRadius: 20,
  },
  cardInner: {
    backgroundColor: '#1E1B2E', // Slightly lighter than pure black for card
    borderRadius: 19, // Slightly less than border radius
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
    // FIXED HEIGHT - All cards same size
    height: 180,
    // Inner glow effect
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  textContent: {
    flex: 1,
    marginRight: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    lineHeight: 24,
    letterSpacing: -0.5
  },
  summary: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 20
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)'
  },
  tagText: {
    color: '#06B6D4',
    fontSize: 11,
    fontWeight: '600'
  },
  moreTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)'
  },
  moreTagText: {
    color: '#A855F7',
    fontSize: 11,
    fontWeight: '600'
  },
  readMore: {
    marginTop: 4,
    color: '#06B6D4',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  actionBtn: {
      padding: 8  // Increased touch target
  },
  glow: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 100,
      height: 100,
      borderRadius: 50,
      opacity: 0.15,
      zIndex: -1,
      transform: [{ scale: 1.5 }]
  }
});

// Optimize rendering with React.memo
export default React.memo(MemoryCard, (prevProps, nextProps) => {
  return (
    prevProps.memory.id === nextProps.memory.id &&
    prevProps.memory.metadata?.favorite === nextProps.memory.metadata?.favorite &&
    prevProps.memory.metadata?.title === nextProps.memory.metadata?.title
  );
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { getBlogPostsByCategory } from '../services/blogService';
import type { BlogPost } from '../types/blog';
import ScreenHeader from '../components/ScreenHeader';
import { CMU_RED, COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';
import { SHADOWS, RADIUS } from '../constants/layout';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'academics', label: 'Academics' },
  { key: 'campus-life', label: 'Campus Life' },
  { key: 'pittsburgh', label: 'Pittsburgh' },
  { key: 'advice', label: 'Advice' },
];

export default function BlogScreen() {
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredPosts = getBlogPostsByCategory(activeCategory);

  const handlePostPress = (post: BlogPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPost(post);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderFeaturedPost = () => {
    const featured = filteredPosts[0];
    if (!featured) return null;
    return (
      <TouchableOpacity
        style={styles.featuredCard}
        onPress={() => handlePostPress(featured)}
        activeOpacity={0.9}
      >
        <View style={styles.featuredImageContainer}>
          {featured.image ? (
            <Image
              source={{ uri: featured.image }}
              style={styles.featuredImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="newspaper-outline" size={48} color="#999" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.featuredGradient}
          />
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Latest</Text>
          </View>
          <View style={styles.featuredOverlay}>
            <Text style={styles.featuredTitle}>{featured.title}</Text>
            <Text style={styles.featuredSubtitle}>{featured.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item, index }: { item: BlogPost; index: number }) => {
    if (index === 0) return null;
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.postImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.postImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagePlaceholder, styles.postImagePlaceholder]}>
              <Ionicons name="newspaper-outline" size={24} color="#999" />
            </View>
          )}
        </View>
        <View style={styles.postContent}>
          <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.postSubtitle} numberOfLines={2}>{item.subtitle}</Text>
          <Text style={styles.postDate}>{formatDate(item.date)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader
        title="Blog"
        onBack={() => router.back()}
      />

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.filterChip,
              activeCategory === cat.key && styles.filterChipActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveCategory(cat.key);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterChipText,
                activeCategory === cat.key && styles.filterChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderFeaturedPost}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Post Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setSelectedPost(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          {selectedPost && (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedPost.image && (
                <Image
                  source={{ uri: selectedPost.image }}
                  style={styles.modalImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.modalBody}>
                <Text style={styles.modalDate}>
                  {formatDate(selectedPost.date)} — {selectedPost.author}
                </Text>
                <Text style={styles.modalTitle}>{selectedPost.title}</Text>
                <Text style={styles.modalSubtitle}>{selectedPost.subtitle}</Text>
                <View style={styles.modalDivider} />
                <Text style={styles.modalContent}>{selectedPost.content}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
  },
  filterChipActive: {
    backgroundColor: CMU_RED,
  },
  filterChipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 24,
  },
  // Featured post
  featuredCard: {
    margin: 16,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    ...SHADOWS.card,
  },
  featuredImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: COLORS.border,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: CMU_RED,
  },
  featuredBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.white,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  // Post list items
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: RADIUS.lg,
    ...SHADOWS.small,
  },
  postImageContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.border,
  },
  postImagePlaceholder: {
    width: 80,
    height: 80,
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  postSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  postDate: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: 240,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  modalDate: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: FONTS.bold,
    fontSize: 26,
    color: COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 32,
  },
  modalSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  modalContent: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 26,
  },
});

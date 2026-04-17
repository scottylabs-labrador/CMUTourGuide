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
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Blog</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

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
              <Ionicons name="close" size={24} color="#333" />
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#C41E3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'SourceSerifPro_600SemiBold',
    color: 'white',
    fontSize: 18,
  },
  headerPlaceholder: {
    width: 40,
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
    backgroundColor: '#F1F3F5',
  },
  filterChipActive: {
    backgroundColor: '#C41E3A',
  },
  filterChipText: {
    fontFamily: 'SourceSerifPro_600SemiBold',
    fontSize: 13,
    color: '#7A8593',
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
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F1F3F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  featuredImageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#e9ecef',
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
    borderRadius: 999,
    backgroundColor: '#C41E3A',
  },
  featuredBadgeText: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 11,
    color: '#fff',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  // Post list items
  postCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  postImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
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
    backgroundColor: '#e9ecef',
  },
  postImagePlaceholder: {
    width: 80,
    height: 80,
  },
  postContent: {
    flex: 1,
  },
  postTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 15,
    color: '#333',
    marginBottom: 3,
  },
  postSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#7A8593',
    marginBottom: 6,
  },
  postDate: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 12,
    color: '#999',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
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
    backgroundColor: '#f1f3f5',
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
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'SourceSerifPro_700Bold',
    fontSize: 26,
    color: '#1F2933',
    marginBottom: 6,
    lineHeight: 32,
  },
  modalSubtitle: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 16,
    color: '#7A8593',
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginBottom: 20,
  },
  modalContent: {
    fontFamily: 'SourceSerifPro_400Regular',
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
});

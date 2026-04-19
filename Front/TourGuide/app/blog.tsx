import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { getBlogPostsByCategory } from '../services/blogService';
import type { BlogPost } from '../types/blog';
import ScreenHeader from '../components/ScreenHeader';
import { COLORS } from '../constants/colors';

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
        className="m-4 rounded-[20px] overflow-hidden bg-card"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}
        onPress={() => handlePostPress(featured)}
        activeOpacity={0.9}
      >
        <View className="w-full h-[220px] relative bg-border">
          {featured.image ? (
            <Image
              source={{ uri: featured.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="w-full h-full justify-center items-center bg-border">
              <Ionicons name="newspaper-outline" size={48} color="#999" />
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className="absolute bottom-0 left-0 right-0 h-[140px]"
          />
          <View className="absolute top-3 left-3 px-3 py-[5px] rounded-full bg-cmu-red">
            <Text className="font-serif-bold text-[11px] text-white">Latest</Text>
          </View>
          <View className="absolute bottom-0 left-0 right-0 p-4">
            <Text className="font-serif-bold text-[20px] text-white mb-1">{featured.title}</Text>
            <Text className="font-serif text-sm text-white/85">{featured.subtitle}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPostItem = ({ item, index }: { item: BlogPost; index: number }) => {
    if (index === 0) return null;
    return (
      <TouchableOpacity
        className="flex-row items-center bg-white mx-4 my-[6px] p-3 rounded-[16px]"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
        onPress={() => handlePostPress(item)}
        activeOpacity={0.8}
      >
        <View className="w-[80px] h-[80px] rounded-[12px] overflow-hidden bg-border mr-3">
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View className="w-[80px] h-[80px] justify-center items-center bg-border">
              <Ionicons name="newspaper-outline" size={24} color="#999" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <Text className="font-serif-bold text-[15px] text-[#1F2933] mb-[3px]" numberOfLines={2}>{item.title}</Text>
          <Text className="font-serif text-[13px] text-[#7A8593] mb-[6px]" numberOfLines={2}>{item.subtitle}</Text>
          <Text className="font-serif text-xs text-muted">{formatDate(item.date)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]">
      {/* Header */}
      <ScreenHeader
        title="Blog"
        onBack={() => router.back()}
      />

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8, alignItems: 'center' }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveCategory(cat.key);
            }}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: 16,
              minHeight: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: activeCategory === cat.key ? '#C41230' : '#E0E0E0',
            }}
          >
            <Text
              style={{
                fontFamily: 'SourceSerifPro_600SemiBold',
                fontSize: 13,
                lineHeight: 18,
                includeFontPadding: false,
                textAlignVertical: 'center',
                color: activeCategory === cat.key ? '#FFFFFF' : '#7A8593',
              }}
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
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Post Detail Modal */}
      <Modal
        visible={selectedPost !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedPost(null)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row justify-end px-4 py-2">
            <TouchableOpacity
              className="w-9 h-9 rounded-[18px] bg-card justify-center items-center"
              onPress={() => setSelectedPost(null)}
            >
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          {selectedPost && (
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedPost.image && (
                <Image
                  source={{ uri: selectedPost.image }}
                  style={{ width: SCREEN_WIDTH, height: 240 }}
                  contentFit="cover"
                />
              )}
              <View className="px-6 pt-5">
                <Text className="font-serif text-[13px] text-muted mb-2">
                  {formatDate(selectedPost.date)} — {selectedPost.author}
                </Text>
                <Text className="font-serif-bold text-[26px] text-[#1F2933] mb-[6px] leading-[32px]">{selectedPost.title}</Text>
                <Text className="font-serif text-[16px] text-[#7A8593] mb-4">{selectedPost.subtitle}</Text>
                <View className="h-[1px] bg-border mb-5" />
                <Text className="font-serif text-[16px] text-[#1F2933] leading-[26px]">{selectedPost.content}</Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

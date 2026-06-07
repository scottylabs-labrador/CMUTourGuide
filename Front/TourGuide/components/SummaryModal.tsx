import React, { useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Dimensions, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { getBuilding } from '../services/buildingService';
import { getBuildingImageSource } from '../constants/buildingImages';
import { useBuildings } from '../contexts/BuildingContext';
import { CMU_RED } from '../constants/colors';
import { usePostHog } from 'posthog-react-native';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    building_id: string;
    isNewUnlock?: boolean;
}

const markdownStyle = {
    body: {
        fontFamily: 'SourceSerifPro_400Regular',
        fontSize: 16,
        color: '#1F2933',
        lineHeight: 24,
        textAlign: 'center' as const,
    },
    strong: {
        fontFamily: 'SourceSerifPro_700Bold',
        color: '#1F2933',
    },
};

export default function SummaryModal({ visible, onClose, building_id, isNewUnlock = false }: SummaryModalProps) {
    const buildingData = getBuilding(building_id);
    const router = useRouter();
    const posthog = usePostHog();
    const { isUnlocked } = useBuildings();
    // A building that hasn't been scanned yet shows a teaser: the first
    // sentence is visible, the rest is blurred to nudge the user to go find
    // and scan it.
    const locked = !!building_id && !isUnlocked(building_id);

    useEffect(() => {
        if (visible && building_id) {
            posthog.capture('building_summary_opened', {
                building_id,
                building_name: buildingData?.title,
                is_new_unlock: isNewUnlock,
                locked,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, building_id]);

    if (!buildingData) {
        return null;
    }

    const paragraphs = Array.isArray(buildingData.tour_guide)
        ? buildingData.tour_guide
        : [buildingData.tour_guide];
    const teaser = paragraphs[0] ?? '';
    const hiddenContent = paragraphs.slice(1).join('\n\n');
    const fullContent = paragraphs.join('\n\n');

    const pushChat = () => {
        if (!buildingData.title) {
            return;
        }
        posthog.capture('chat_started', {
            building_id,
            building_name: buildingData.title,
        });
        onClose();
        router.push({
            pathname: "/chat",
            params: {
                building_id,
                building_name: buildingData.title,
            },
        });
    }

    const pushCamera = () => {
        posthog.capture('scan_to_unlock_pressed', {
            building_id,
            building_name: buildingData.title,
        });
        onClose();
        router.push('/camera');
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/70 justify-center items-center">
                <Pressable
                    onPress={onClose}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View
                    className="bg-white rounded-[20px] p-5 items-center"
                    style={{
                        width: SCREEN_WIDTH * 0.9,
                        height: SCREEN_HEIGHT * 0.7,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                    }}
                >
                    {/* Header Row with Close Button and Badge */}
                    <View className="flex-row items-center justify-between w-full mb-[5px]">
                        {/* New Discovery Badge */}
                        {isNewUnlock ? (
                            <View className="flex-row items-center justify-center bg-[#FFF9E6] py-2 px-4 rounded-[20px] border-2 border-[#FFD700] gap-2 flex-1 mr-2">
                                <Ionicons name="star" size={20} color="#FFD700" />
                                <Text className="font-serif-bold text-base text-cmu-red">New Discovery!</Text>
                                <Ionicons name="star" size={20} color="#FFD700" />
                            </View>
                        ) : locked ? (
                            <View className="flex-row items-center justify-center bg-[#F3F4F6] py-2 px-4 rounded-[20px] border-2 border-border gap-2 flex-1 mr-2">
                                <Ionicons name="lock-closed" size={16} color="#666" />
                                <Text className="font-serif-bold text-base text-[#666]">Locked</Text>
                            </View>
                        ) : (
                            <View className="flex-1" />
                        )}

                        {/* Close Button */}
                        <TouchableOpacity
                            className="p-1"
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={28} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Image — always shown, locked or not */}
                    <View className="w-full h-[200px] rounded-[12px] overflow-hidden mb-5 bg-[#f0f0f0]">
                        {(() => {
                            const source = getBuildingImageSource(building_id);
                            return source ? (
                                <Image
                                    source={source}
                                    style={{ width: '100%', height: '100%' }}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
                                    transition={200}
                                    recyclingKey={building_id}
                                />
                            ) : null;
                        })()}
                    </View>

                    {/* Title */}
                    <Text className="font-serif-bold text-2xl text-cmu-red mb-4 text-center">{buildingData.title}</Text>

                    {/* Description */}
                    {locked ? (
                        <View className="w-full flex-1 mb-6">
                            {/* Teaser: first sentence is always readable */}
                            <Markdown style={markdownStyle}>{teaser}</Markdown>

                            {/* Blurred remainder with a scan prompt overlay */}
                            {hiddenContent.length > 0 && (
                                <View className="flex-1 mt-3 rounded-[12px] overflow-hidden">
                                    <ScrollView scrollEnabled={false}>
                                        <Markdown style={markdownStyle}>{hiddenContent}</Markdown>
                                    </ScrollView>
                                    <BlurView
                                        intensity={18}
                                        tint="light"
                                        experimentalBlurMethod="dimezisBlurView"
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                        className="items-center justify-center px-4"
                                    >
                                        <View className="items-center bg-white/55 rounded-[14px] px-5 py-4">
                                            <Ionicons name="lock-closed" size={26} color={CMU_RED} />
                                            <Text className="font-serif-semi text-base text-cmu-red mt-2 text-center">
                                                Scan to unlock more Information
                                            </Text>
                                        </View>
                                    </BlurView>
                                </View>
                            )}
                        </View>
                    ) : (
                        <ScrollView className="w-full mb-6">
                            <Markdown style={markdownStyle}>{fullContent}</Markdown>
                        </ScrollView>
                    )}

                    <View className="flex-row w-full">
                        {locked ? (
                            <TouchableOpacity
                                className="bg-cmu-red px-[10px] py-[14px] rounded-[25px] flex-1 flex-row items-center justify-center gap-2"
                                onPress={pushCamera}
                            >
                                <Ionicons name="camera" size={18} color="#fff" />
                                <Text className="font-serif-semi text-white text-base">Scan to Unlock</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                className="bg-cmu-red px-[10px] py-[14px] rounded-[25px] flex-1 items-center"
                                onPress={pushChat}
                            >
                                <Text className="font-serif-semi text-white text-base">Chat More</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>
            </View>
        </Modal>
    );
}

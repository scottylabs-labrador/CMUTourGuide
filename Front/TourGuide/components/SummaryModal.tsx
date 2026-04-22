import React from 'react';
import { View, Text, Image, Modal, TouchableOpacity, Pressable, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import { getBuilding } from '../services/buildingService';
import { getBuildingImageSource } from '../constants/buildingImages';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    building_id: string;
    isNewUnlock?: boolean;
}

export default function SummaryModal({ visible, onClose, building_id, isNewUnlock = false }: SummaryModalProps) {
    const buildingData = getBuilding(building_id);
    const router = useRouter()

    if (!buildingData) {
        return null;
    }

    const pushChat = () => {
        if (!buildingData.title) {
            return;
        }
        onClose();
        router.push({
            pathname: "/chat",
            params: {
                building_id,
                building_name: buildingData.title,
            },
        })
    }
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

                    {/* Image */}
                    <View className="w-full h-[200px] rounded-[12px] overflow-hidden mb-5 bg-[#f0f0f0]">
                        {(() => {
                            const source = getBuildingImageSource(building_id, buildingData.image_url);
                            return source ? (
                                <Image
                                    source={source}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                            ) : null;
                        })()}
                    </View>

                    {/* Title */}
                    <Text className="font-serif-bold text-2xl text-cmu-red mb-4 text-center">{buildingData.title}</Text>

                    {/* Description Text Placeholder */}
                    <ScrollView
                        className="w-full mb-6"
                    >
                        <Markdown
                            style={{
                                body: {
                                    fontFamily: 'SourceSerifPro_400Regular',
                                    fontSize: 16,
                                    color: '#1F2933',
                                    lineHeight: 24,
                                    textAlign: 'center',
                                },
                                strong: {
                                    fontFamily: 'SourceSerifPro_700Bold',
                                    color: '#1F2933',
                                },
                            }}
                        >
                            {Array.isArray(buildingData.tour_guide)
                                ? buildingData.tour_guide.join('\n\n')
                                : buildingData.tour_guide}
                        </Markdown>
                    </ScrollView>

                    <View className="flex-row">
                        <TouchableOpacity
                            className="bg-cmu-red px-[10px] py-[14px] rounded-[25px] w-1/2 items-center mx-1"
                            onPress={pushChat}
                        >
                            <Text className="font-serif-semi text-white text-base">Chat More</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-cmu-red px-[10px] py-[14px] rounded-[25px] w-1/2 items-center mx-1"
                            onPress={onClose}
                        >
                            <Text className="font-serif-semi text-white text-base">Look Inside</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

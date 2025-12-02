import React from 'react';
import { View, Text, Image, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import buildings from "../components/buildings.json"
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    building_id: string;
}

export default function SummaryModal({ visible, onClose, building_id }: SummaryModalProps) {
    const buildingData = buildings[building_id as keyof typeof buildings]
    const router = useRouter()

    if (!buildingData) {
        return null;
    }

    const pushChat = () => {
        if (!buildingData.title) {
            return;
        }
        onClose();
        router.push({ pathname: "/chat", params: { building_name: buildingData.title } })
    }
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Close Button */}
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={28} color="#666" />
                    </TouchableOpacity>

                    {/* Image Placeholder */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: buildingData.image_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{buildingData.title}</Text>

                    {/* Description Text Placeholder */}
                    <ScrollView
                        style={styles.textContainer}
                    >
                        <Text style={styles.description}>{buildingData.summary}
                        </Text>
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={pushChat}
                        >
                            <Text style={styles.actionButtonText}>Chat More</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onClose}
                        >
                            <Text style={styles.actionButtonText}>Look Inside</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: SCREEN_WIDTH * 0.9,
        height: SCREEN_HEIGHT * 0.7,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    closeButton: {
        alignSelf: 'flex-end',
        marginBottom: 5,
    },
    imageContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#C41E3A',
        marginBottom: 16,
        textAlign: 'center',
    },
    textContainer: {
        width: '100%',
        marginBottom: 24,
    },
    description: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        backgroundColor: '#C41E3A',
        paddingHorizontal: 10,
        paddingVertical: 14,
        borderRadius: 25,
        width: '50%',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

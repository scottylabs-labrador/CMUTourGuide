import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Route } from '../data/routes';
import { CMU_RED, COLORS } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RoutePickerModalProps {
  visible: boolean;
  onClose: () => void;
  routes: Route[];
  activeRouteId: string | null;
  onSelect: (routeId: string | null) => void;
}

export default function RoutePickerModal({
  visible,
  onClose,
  routes,
  activeRouteId,
  onSelect,
}: RoutePickerModalProps) {
  const handleSelect = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center">
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          className="bg-white rounded-[20px] p-5"
          style={{
            width: SCREEN_WIDTH * 0.9,
            maxHeight: '75%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-serif-bold text-[20px] text-cmu-red">
              Tour Routes
            </Text>
            <TouchableOpacity className="p-1" onPress={onClose}>
              <Ionicons name="close" size={26} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              className="flex-row items-center py-3 px-3 rounded-[12px] mb-2"
              style={{
                backgroundColor:
                  activeRouteId === null ? '#F5F5F5' : 'transparent',
                borderWidth: 1,
                borderColor: activeRouteId === null ? CMU_RED : '#E5E5E5',
              }}
              onPress={() => handleSelect(null)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  activeRouteId === null
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={22}
                color={activeRouteId === null ? CMU_RED : COLORS.textMuted}
              />
              <View className="ml-3 flex-1">
                <Text className="font-serif-semi text-[15px] text-slate-800">
                  No route
                </Text>
                <Text className="font-serif text-[12px] text-slate-500 mt-[2px]">
                  Hide all tour paths
                </Text>
              </View>
            </TouchableOpacity>

            {routes.map((route) => {
              const active = route.id === activeRouteId;
              return (
                <TouchableOpacity
                  key={route.id}
                  className="flex-row items-start py-3 px-3 rounded-[12px] mb-2"
                  style={{
                    backgroundColor: active ? '#FFF5F6' : 'transparent',
                    borderWidth: 1,
                    borderColor: active ? CMU_RED : '#E5E5E5',
                  }}
                  onPress={() => handleSelect(route.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={active ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={active ? CMU_RED : COLORS.textMuted}
                    style={{ marginTop: 2 }}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-serif-bold text-[16px] text-cmu-red">
                      {route.name}
                    </Text>
                    {route.description && (
                      <Text className="font-serif text-[13px] text-slate-600 mt-[2px]">
                        {route.description}
                      </Text>
                    )}
                    <Text className="font-serif text-[11px] text-slate-500 mt-1">
                      {route.stops.length} stops
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

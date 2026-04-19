import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CMU_RED, IRON_GRAY, WHITE, STEEL_GRAY } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: CMU_RED,
        tabBarInactiveTintColor: IRON_GRAY,
        tabBarStyle: {
          backgroundColor: WHITE,
          borderTopColor: STEEL_GRAY,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'OpenSans_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="buildings"
        options={{
          title: 'Buildings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

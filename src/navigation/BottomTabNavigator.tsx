import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from './types';
import { HomeScreen } from '../views/HomeScreen';
import { AnalyticsScreen } from '../views/AnalyticsScreen';
import { FixedExpenseScreen } from '../views/FixedExpenseScreen';
import { MainTopHeader } from '../components/MainTopHeader';
import { theme } from '../theme';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Fixed Synchronous Top Header across all 3 screens */}
      <MainTopHeader />

      {/* 2. Middle Tab Content (Only this section animates / shifts on tab switch) */}
      <View style={styles.tabContentContainer}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: '#8E9F96',
            tabBarStyle: styles.tabBar,
            tabBarLabelStyle: styles.tabBarLabel,
            // Smooth slide & shift animation across tabs
            animation: 'shift',
            transitionSpec: {
              animation: 'timing',
              config: {
                duration: 220,
              },
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Tổng quan',
              tabBarIcon: ({ color, focused, size }) => (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size || 22}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Analytics"
            component={AnalyticsScreen}
            options={{
              tabBarLabel: 'Thống kê',
              tabBarIcon: ({ color, focused, size }) => (
                <Ionicons
                  name={focused ? 'trending-up' : 'trending-up-outline'}
                  size={size || 22}
                  color={color}
                />
              ),
            }}
          />
          <Tab.Screen
            name="Fixed"
            component={FixedExpenseScreen}
            options={{
              tabBarLabel: 'Cố định',
              tabBarIcon: ({ color, focused, size }) => (
                <Ionicons
                  name={focused ? 'receipt' : 'receipt-outline'}
                  size={size || 22}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContentContainer: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
    paddingTop: 6,
    height: Platform.OS === 'ios' ? 84 : 62,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 8,
    shadowColor: '#17271F',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: Platform.OS === 'ios' ? 0 : 6,
  },
});

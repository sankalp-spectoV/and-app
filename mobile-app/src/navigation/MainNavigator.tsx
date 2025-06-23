import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import CoursesScreen from '../screens/main/CoursesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import CourseDetailScreen from '../screens/main/CourseDetailScreen';
import VideoPlayerScreen from '../screens/main/VideoPlayerScreen';
import PaymentWebViewScreen from '../screens/main/PaymentWebViewScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="HomeMain" 
      component={HomeScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="CourseDetail" 
      component={CourseDetailScreen}
      options={{ title: 'Course Details' }}
    />
    <Stack.Screen 
      name="VideoPlayer" 
      component={VideoPlayerScreen}
      options={{ 
        title: 'Video Player',
        headerShown: false,
        orientation: 'landscape'
      }}
    />
    <Stack.Screen 
      name="PaymentWebView" 
      component={PaymentWebViewScreen}
      options={{ title: 'Payment' }}
    />
  </Stack.Navigator>
);

const CoursesStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="CoursesMain" 
      component={CoursesScreen} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="CourseDetail" 
      component={CourseDetailScreen}
      options={{ title: 'Course Details' }}
    />
    <Stack.Screen 
      name="VideoPlayer" 
      component={VideoPlayerScreen}
      options={{ 
        title: 'Video Player',
        headerShown: false,
        orientation: 'landscape'
      }}
    />
  </Stack.Navigator>
);

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Courses') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Courses" component={CoursesStack} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
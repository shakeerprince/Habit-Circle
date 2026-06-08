https://www.instagram.com/derongchen.art/// ═══════════════════════════════════════════════════════════════
//  Rithmic — Bottom Tab Layout
//  5 tabs: Tasks, Friends, Dashboard (Home), Communities, Profile
// ═══════════════════════════════════════════════════════════════

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radius } from '../../lib/theme';

type TabIcon = 'checklist' | 'group' | 'dashboard' | 'forum' | 'person';

function TabIcon({ name, focused }: { name: TabIcon; focused: boolean }) {
    return (
        <View style={styles.tabIconContainer}>
            {focused && <View style={styles.activeIndicator} />}
            <MaterialIcons name={name} size={24} color={focused ? colors.accent : colors.textMuted} />
        </View>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="tasks"
                options={{
                    title: 'Tasks',
                    tabBarIcon: ({ focused }) => <TabIcon name="checklist" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="friends"
                options={{
                    title: 'Friends',
                    tabBarIcon: ({ focused }) => <TabIcon name="group" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ focused }) => <TabIcon name="dashboard" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="communities"
                options={{
                    title: 'Groups',
                    tabBarIcon: ({ focused }) => <TabIcon name="forum" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.bgPrimary,
        borderTopColor: colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: 6,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        top: -10,
        width: 24,
        height: 3,
        backgroundColor: colors.accent,
        borderRadius: 2,
    },
});

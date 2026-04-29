import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';
import { Text } from '@/components';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={styles.tab}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
      <Text
        variant="small"
        color={focused ? colors.primary : colors.textDim}
        style={{ fontWeight: focused ? '700' : '500' }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.bar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Today" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="clans"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Clans" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎬" label="Feed" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" label="Shop" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="You" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingTop: spacing.sm,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 60,
  },
});

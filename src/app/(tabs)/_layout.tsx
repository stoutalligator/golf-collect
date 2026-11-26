import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/tab-bar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    // The page color sits behind the tab bar's rounded corners.
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.cream } }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="courses" options={{ title: 'Courses' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
    </Tabs>
  );
}

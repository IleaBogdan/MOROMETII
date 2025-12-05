import { Tabs, usePathname, RelativePathString, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDynamicTheme } from '@/theme/theme';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { addToHistory, getPrevPath } from '@/history/navigationHistory';
export const TopBar: React.FC = () => {
  const theme = useDynamicTheme();
  const pathname = usePathname();


  const pageName =
    pathname.replace('/', ' ')[1]?.toUpperCase() +
    pathname.replace('/', ' ').slice(2);

  useEffect(() => {
    addToHistory(pathname);
  }, [pathname]);

  const canGoBack = () => {
    return pathname !== '/(tabs)/home' && pathname !== '/(tabs)';
  };

  return (
    <Appbar.Header
      style={[styles.header, { backgroundColor: theme.colors.background }]}
    >
      {/* BACK BUTTON */}
      {canGoBack() ? (
        <Appbar.BackAction
          onPress={() => {
            const prev = getPrevPath();
            router.push(prev as RelativePathString);
          }}
        />
      ) : (
        <Appbar.Action icon="menu" color="transparent" />
      )}

      {/* CENTER TITLE */}
      <Appbar.Content title={pageName} style={{ alignItems: 'center' }} />

      {/* ACCOUNT BUTTON ON RIGHT */}
      <Appbar.Action
        icon="account-circle"
        color={theme.colors.primary}
        onPress={() => router.push("/(tabs)/account" as RelativePathString)}
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 0,
  },
});
const stylesHeader = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 0,
  },
  logo: {
    height: 40,
    width: 160,
  },
});

/* ------------------------------------------------------- */
/*                     BOTTOM BAR                           */
/* ------------------------------------------------------- */
const BottomBar: React.FC = () => {
  const theme = useDynamicTheme();
  const pathname = usePathname();

  const tabs = [
    // { key: 'urgente', label: 'Urgente', icon: 'warning' },
    // { key: 'cursuri', label: 'Cursuri', icon: 'school' },
    // { key: 'harta', label: 'Hartă', icon: 'map' },
    // { key: 'raporteaza', label: 'Raportează', icon: 'alert-circle' },
    // { key: 'settings', label: 'Setări', icon: 'settings' },
    { key: 'home', label: 'Acasă', icon: 'home' },
  ];

  return (
    <Appbar style={[stylesBottom.container, { backgroundColor: theme.colors.background }]}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.key);
        const color = isActive ? theme.colors.primary : theme.colors.primary;

        return (
          <TouchableOpacity
            key={tab.key}
            style={stylesBottom.tabButton}
            onPress={() => router.push(`/(tabs)/${tab.key}` as RelativePathString)}
          >
            <Ionicons name={tab.icon as any} size={22} color={color} />
            <Text style={[stylesBottom.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}

    </Appbar>
  );
};

const stylesBottom = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 6,
    paddingBottom: 16,
    elevation: 6,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});

/* ------------------------------------------------------- */
/*                    TAB LAYOUT MAIN                       */
/* ------------------------------------------------------- */
const TabLayout = () => {
  return (
    <Tabs
      tabBar={() => (<BottomBar />)}
      screenOptions={{
        header: () => <TopBar />,
      }}
    >
      <Tabs.Screen name="cont" options={{ title: 'Cont' }} />
      <Tabs.Screen name="urgente" options={{ title: 'Urgente' }} />
      <Tabs.Screen name="cursuri" options={{ title: 'Cursuri' }} />
      <Tabs.Screen name="harta" options={{ title: 'Hartă' }} />
      <Tabs.Screen name="raporteaza" options={{ title: 'Raportează' }} />
      <Tabs.Screen name="settings" options={{ title: 'Setări' }} />
    </Tabs>
  );
};

export default TabLayout;

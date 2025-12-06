import { useDynamicTheme } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router, Tabs, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Appbar } from 'react-native-paper';

import { addToHistory } from '@/history/navigationHistory';

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
    return pathname !== '/(tabs)/acasa' && pathname !== '/(tabs)';
  };
   const isOnSign = pathname === '/(tabs)/signin' || pathname === '/(tabs)/signup';
  return (
    <Appbar.Header
      style={[styles.header, { backgroundColor: theme.colors.background }]}
    >
      {/*
      {canGoBack() ? (
        <Appbar.BackAction
          onPress={() => {
            const prev = getPrevPath();
            router.push(prev as RelativePathString);
          }}
        />
      ) : (
        <Appbar.Action icon="menu" color="transparent" />
      )}*/}
      {isOnSign && <Appbar.Content title={pageName} style={{ alignItems: 'center' }} />}
      {/*<Appbar.Action
        icon="account-circle"
        color={theme.colors.primary}
        onPress={() => router.push("/(tabs)/cont" as RelativePathString)}
      />*/}
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

const BottomBar: React.FC = () => {
  const theme = useDynamicTheme();
  const pathname = usePathname();

  const tabs = [
    // { key: 'urgente', label: 'Urgente', icon: 'warning' },
    // { key: 'cursuri', label: 'Cursuri', icon: 'school' },
    // { key: 'harta', label: 'Hartă', icon: 'map' },
    // { key: 'raporteaza', label: 'Raportează', icon: 'alert-circle' },
    // { key: 'settings', label: 'Setări', icon: 'settings' },
    { key: 'acasa', label: 'Urgențe', icon: 'warning' },
    { key: 'cont', label: 'Cont', icon: 'person' },
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
            <Ionicons name={tab.icon as any} size={40} color={color} />
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
    paddingBottom: 50,
    elevation: 6,
    height:120,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 14,
    marginTop: 2,
  },
});

const TabLayout = () => {
  const pathname = usePathname();
  const isOnSign = pathname === '/(tabs)/signin' || pathname === '/(tabs)/signup';
  return (
    <Tabs
      tabBar={() => (isOnSign ? <BottomBar /> : null)}
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

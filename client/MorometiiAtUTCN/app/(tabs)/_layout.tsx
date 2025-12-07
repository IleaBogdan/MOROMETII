import { theme } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router, Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Appbar } from 'react-native-paper';

import { addToHistory } from '@/history/navigationHistory';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAdmin } from '@/hooks/useAdmin';

export const TopBar: React.FC = () => {
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
      <Appbar.Content title={pageName} style={{ alignItems: 'center' }} />
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

const BottomBar: React.FC<{ admin: Boolean }> = ({ admin }) => {
  const pathname = usePathname();
  const tabs = [
    { key: 'admin', label: 'Raporteaza', icon: 'shield-checkmark' },
    { key: 'acasa', label: 'Urgențe', icon: 'warning' },
    { key: 'cont', label: 'Cont', icon: 'person' },
  ];
  if (!admin) {
    tabs.splice(0, 1);
  }
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
            <Ionicons name={tab.icon as any} size={24} color={color} />
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
    paddingBottom: 20,
    elevation: 6,
    height: 65,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 8,
    marginTop: 2,
  },
});


const TabLayout = () => {
  const pathname = usePathname();
  const isAdmin = useAdmin();
  const isOnSign = !pathname.includes("/signin") && !pathname.includes("/signup");

  return (
    <Tabs
      tabBar={() => (!isOnSign ? null : <BottomBar admin={isAdmin} />)}
      screenOptions={{
        header: () => (null),
      }}
    >
      <Tabs.Screen name="cont" options={{ title: "Cont" }} />

      {isAdmin && (
        <Tabs.Screen
          name="raporteaza"
          options={{ title: "Raportează" }}
        />
      )}

      {/* Common tabs */}
      <Tabs.Screen name="urgente" options={{ title: "Urgente" }} />
      <Tabs.Screen name="cursuri" options={{ title: "Cursuri" }} />
      <Tabs.Screen name="harta" options={{ title: "Hartă" }} />
      <Tabs.Screen name="settings" options={{ title: "Setări" }} />
    </Tabs>
  );
};


export default TabLayout;

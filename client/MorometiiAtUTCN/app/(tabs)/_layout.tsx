// import { addToHistory, getPrevPath } from '@/components/history/navigationHistory';
import { useDynamicTheme } from '@/theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { RelativePathString, router, Tabs, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Appbar, Menu } from 'react-native-paper';

export const TopBar: React.FC = () => {
  // const [menuVisible, setMenuVisible] = useState(false);
  // const user = useAuth();

  // const openMenu = () => setMenuVisible(true);
  // const closeMenu = () => setMenuVisible(false);
  // const { resetPhotos, clearAllPhotos } = useScanFunctions();
  // const handleLogout = async () => {
  //   await signOut(auth);
  //   closeMenu();
  //   const prev = getPrevPath();
  //   router.push(prev as RelativePathString);
  // };

  // return (
  //   <Appbar.Header style={styles.header}>
  //     <Appbar.BackAction
  //       onPress={() => {
  //         const prev = getPrevPath();
  //         if (prev !== '/(tabs)/scan/results') {
  //           clearAllPhotos();
  //           resetPhotos();
  //         }
  //         router.push(prev as RelativePathString);
  //       }}
  //       size={31}
  //       color={theme.colors.primaryDark}
  //     />

  //     <Image
  //       source={require('../../assets/images/prevedermaheightcopy.png')}
  //       style={styles.logo}
  //       resizeMode="contain"
  //     />

  //     <Menu
  //       visible={menuVisible}
  //       onDismiss={closeMenu}
  //       contentStyle={{ backgroundColor: theme.colors.secondaryLightContainer }}
  //       style={{ paddingTop: 55 }}
  //       anchor={
  //         <Appbar.Action
  //           icon="dots-vertical"
  //           onPress={openMenu}
  //           size={31}
  //           color={theme.colors.primaryDark}
  //         />
  //       }
  //     >
  //       {user ? (
  //         <>
  //           <Menu.Item title={`You're logged in.`} disabled titleStyle={{}} />
  //           <Menu.Item
  //             onPress={handleLogout}
  //             title="Logout"
  //             titleStyle={{ color: theme.colors.onSecondaryDarkContainer }}
  //           />
  //         </>
  //       ) : (
  //         <Menu.Item
  //           onPress={() => {
  //             closeMenu();
  //             router.push('/auth' as RelativePathString);
  //           }}
  //           title="Login / Sign Up"
  //           titleStyle={{ color: theme.colors.onSecondaryDarkContainer }}
  //         />
  //       )}
  //     </Menu>
  //   </Appbar.Header>
  // );
  return (<>
  </>);
};

const BottomBar: React.FC = () => {
  // const pathname = usePathname();
  // const user = useAuth();
  // const tabs = [
  //   { path: 'home', label: 'Home', icon: 'home' },
  //   { path: 'scan', label: 'Scan', icon: 'camera' },
  //   { path: 'about', label: 'About', icon: 'information-circle' },
  //   {
  //     path: user ? 'account' : 'auth',
  //     label: user ? 'Account' : 'Log In',
  //     icon: user ? 'person' : 'log-in',
  //   },
  // ];

  // return (
  //   <Appbar style={styles.bottomBar}>
  //     {tabs.map((tab) => {
  //       const isActive = pathname.startsWith(`/${tab.path}`);
  //       const color = isActive ? theme.colors.primaryLight : '#000';

  //       return (
  //         <TouchableOpacity
  //           key={tab.path}
  //           style={styles.tabButton}
  //           onPress={() => router.push(`/(tabs)/${tab.path}` as RelativePathString)}
  //         >
  //           <Ionicons name={tab.icon as any} size={24} color={color} />
  //           <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
  //         </TouchableOpacity>
  //       );
  //     })}
  //   </Appbar>
  // );
  return (<></>);
};
const theme = useDynamicTheme();
const TabLayout = () => {
  // const pathname = usePathname();
  // const isScanPage = !pathname.startsWith('/scan/photo');
  // useEffect(() => {
  //   addToHistory(pathname);
  // }, [pathname]);

  return (
    <Tabs
      tabBar={() => (<BottomBar />)}
      screenOptions={{
        header: () => (<TopBar />),
      }}
    >
      <Tabs.Screen name="home/index" options={{ title: 'Home' }} />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    elevation: 0,
  },
  logo: {
    width: '50%',
    height: 44,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.background,
    elevation: 4,
    paddingVertical: 6,
    paddingBottom: 20,
  },
  drawerContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
export default TabLayout;

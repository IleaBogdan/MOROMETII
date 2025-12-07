// Refactored EmergencyDashboard with improved styling, cleaner layout, and full theme usage
// --- START OF FILE ---
import { API_BASE } from '@/api/apiCalls';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import {
    Appbar,
    Card,
    Button,
    FAB,
    Portal,
    Modal,
    TextInput,
    Text,
    Chip,
    Divider,
    useTheme,
    Snackbar,
} from 'react-native-paper';

interface Emergency {
    id: number;
    name: string;
    description: string;
    level: number;
    location_X: number;
    location_Y: number;
}

const EmergencyDashboard = () => {
    const theme = useTheme();

    const [urgencies, setUrgencies] = useState<Emergency[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formLevel, setFormLevel] = useState('1');
    const [locX, setLocX] = useState('');
    const [locY, setLocY] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleRefreshUrgencies = async () => {
        setRefreshing(true);
        try {
            const response = await fetch(`${API_BASE}/api/Emergency/FindEmergency`);
            const data = await response.json();

            if (response.ok && data.ems) {
                setUrgencies(data.ems);
            } else {
                console.warn('Failed to fetch emergencies');
            }
        } catch (error) {
            console.error(error);
            setToastMessage('Error connecting to server.');
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        handleRefreshUrgencies();
    }, []);

    const handleCreateEmergency = async () => {
        if (!formName || !formDesc || !locX || !locY) {
            setToastMessage('Please fill in all fields.');
            return;
        }

        setSubmitting(true);
        const payload = {
            name: formName,
            description: formDesc,
            level: parseInt(formLevel),
            location_X: parseFloat(locX),
            location_Y: parseFloat(locY),
        };

        try {
            const response = await fetch(`${API_BASE}/api/Emergency/MakeEmergency`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setToastMessage('Emergency reported.');
                setModalVisible(false);
                resetForm();
                handleRefreshUrgencies();
            } else {
                setToastMessage('Failed to report emergency.');
            }
        } catch (error) {
            console.error(error);
            setToastMessage('Network error.');
        } finally {
            setSubmitting(false);
        }
    };
    const handleDeletion = async (id: number) => {
        try {
            const res = await fetch(`${API_BASE}/api/Emergency/DeleteEmergency`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, name: "", description: "", level: 0, location_X: 0, location_Y: 0 }),
            });

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                console.warn('Delete failed', res.status, data);
                setToastMessage('Failed to delete emergency.');
                return null;
            }
            await handleRefreshUrgencies();
            setToastMessage('Emergency resolved.');
            return data;
        } catch (error) {
            console.error('Deletion error', error);
            setToastMessage('Network error while deleting.');
            return null;
        }
    };

    const handleEndEmergency = (id: number) => {
        Alert.alert('Resolve Emergency', 'Mark this emergency as resolved?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Resolve',
                style: 'destructive',
                onPress: async () => {
                    const result = await handleDeletion(id);

                    if (!result) {
                        console.warn('Deletion not confirmed by server');
                    }
                },
            },
        ]);
    };
    const resetForm = () => {
        setFormName('');
        setFormDesc('');
        setFormLevel('1');
        setLocX('');
        setLocY('');
    };

    const getColorByLevel = (level: number) => {
        return level >= 4 ? theme.colors.error : level >= 2 ? theme.colors.primary : theme.colors.secondary;
    };

    const renderItem = ({ item }: { item: Emergency }) => (
        <Card style={styles(theme).card} mode="elevated">
            <Card.Title
                title={item.name}
                titleStyle={{ fontWeight: '700', color: theme.colors.onSurface }}
                subtitle={`ID: ${item.id}  |  (${item.location_X.toFixed(4)}, ${item.location_Y.toFixed(4)})`}
                left={() => (
                    <Chip style={[styles(theme).levelChip, { backgroundColor: getColorByLevel(item.level) }]}>Lvl {item.level}</Chip>
                )}
            />

            <Card.Content>
                <Text style={styles(theme).description}>{item.description}</Text>
            </Card.Content>

            <Divider style={{ marginVertical: 12 }} />

            <Card.Actions>
                <Button
                    mode="contained"
                    onPress={() => handleEndEmergency(item.id)}
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.onErrorContainer}
                    icon="alert-octagon"
                >
                    Resolve
                </Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles(theme).container}>
            <Appbar.Header mode="center-aligned" elevated>
                <Appbar.Content title="Emergency Ops" subtitle="Real-Time Control" />
                <Appbar.Action icon="refresh" onPress={handleRefreshUrgencies} />
            </Appbar.Header>

            <FlatList
                data={urgencies}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles(theme).listContent}
                refreshing={refreshing}
                onRefresh={handleRefreshUrgencies}
                ListEmptyComponent={!refreshing ? (
                    <View style={styles(theme).emptyContainer}>
                        <Text variant="bodyLarge">No active emergencies.</Text>
                    </View>
                ) : null}
            />

            <FAB
                icon="plus"
                label="New Report"
                style={styles(theme).fab}
                onPress={() => setModalVisible(true)}
            />

            <Portal>
                <Modal visible={modalVisible} onDismiss={() => setModalVisible(false)} contentContainerStyle={styles(theme).modalContainer}>
                    <ScrollView>
                        <Text style={styles(theme).modalTitle} variant="headlineSmall">Report Emergency</Text>
                        <Divider style={{ marginBottom: 16 }} />

                        <TextInput label="Emergency Name" mode="outlined" value={formName} onChangeText={setFormName} style={styles(theme).input} />

                        <TextInput label="Description" mode="outlined" multiline numberOfLines={3} value={formDesc} onChangeText={setFormDesc} style={styles(theme).input} />

                        <View style={styles(theme).row}>
                            <TextInput label="Level (1-5)" mode="outlined" keyboardType="numeric" value={formLevel} onChangeText={setFormLevel} style={[styles(theme).input, { flex: 1, marginRight: 8 }]} />
                            <Chip icon="alert" style={styles(theme).indicatorChip}>Severity {formLevel}</Chip>
                        </View>

                        <Text variant="labelLarge" style={{ marginTop: 10 }}>Location</Text>

                        <View style={styles(theme).row}>
                            <TextInput label="Latitude (X)" mode="outlined" keyboardType="numeric" value={locX} onChangeText={setLocX} style={[styles(theme).input, { flex: 1, marginRight: 6 }]} />
                            <TextInput label="Longitude (Y)" mode="outlined" keyboardType="numeric" value={locY} onChangeText={setLocY} style={[styles(theme).input, { flex: 1, marginLeft: 6 }]} />
                        </View>

                        <Button mode="contained" onPress={handleCreateEmergency} loading={submitting} disabled={submitting} style={styles(theme).submitBtn}>
                            Send Alert
                        </Button>

                        <Button onPress={() => setModalVisible(false)} disabled={submitting}>Cancel</Button>
                    </ScrollView>
                </Modal>
            </Portal>

            <Snackbar visible={toastMessage !== null} onDismiss={() => setToastMessage(null)} duration={2500}>
                {toastMessage}
            </Snackbar>
        </View>
    );
};

const styles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },

        listContent: {
            padding: 16,
            paddingBottom: 100,
        },

        card: {
            marginBottom: 16,
            borderRadius: 14,
            backgroundColor: theme.colors.surface,
        },

        description: {
            marginTop: 8,
            color: theme.colors.onSurfaceVariant,
        },

        levelChip: {
            marginLeft: 4,
            alignSelf: 'center',
        },

        fab: {
            position: 'absolute',
            right: 20,
            bottom: 20,
        },

        emptyContainer: {
            marginTop: 80,
            alignItems: 'center',
        },

        modalContainer: {
            backgroundColor: theme.colors.surface,
            padding: 20,
            margin: 20,
            borderRadius: 16,
        },

        modalTitle: {
            textAlign: 'center',
            marginBottom: 12,
            color: theme.colors.onSurface,
        },

        input: {
            marginBottom: 14,
            backgroundColor: theme.colors.surfaceVariant,
        },

        indicatorChip: {
            alignSelf: 'center',
            marginTop: 4,
        },

        row: {
            flexDirection: 'row',
        },

        submitBtn: {
            marginVertical: 12,
            backgroundColor: theme.colors.primary,
        },
    });

export default EmergencyDashboard;


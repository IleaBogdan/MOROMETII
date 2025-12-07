import { API_BASE } from '@/api/apiCalls';
import { theme } from '@/theme/theme';
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
    Snackbar
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
            const response = await fetch(`${API_BASE}/api/Emergency/FindEmergency`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (response.ok && data.ems) {
                setUrgencies(data.ems);
            } else {
                console.warn("Failed to fetch urgencies or format incorrect");
            }
        } catch (error) {
            console.error("Error refreshing urgencies:", error);
            setToastMessage("Could not connect to server.");
        } finally {
            setRefreshing(false);
        }
    };

    // Initial Load
    useEffect(() => {
        handleRefreshUrgencies();
    }, []);

    // 2. POST: Create Emergency
    const handleCreateEmergency = async () => {
        // Basic Validation
        if (!formName || !formDesc || !locX || !locY) {
            setToastMessage("Please fill in all fields.");
            return;
        }

        setSubmitting(true);
        const payload = {
            name: formName,
            description: formDesc,
            level: parseInt(formLevel),
            location_X: parseFloat(locX),
            location_Y: parseFloat(locY)
        };

        try {
            const response = await fetch(`${API_BASE}/api/Emergency/MakeEmergency`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setToastMessage("Emergency Reported Successfully.");
                setModalVisible(false);
                resetForm();
                handleRefreshUrgencies();
            } else {
                setToastMessage("Failed to report emergency.");
            }
        } catch (error) {
            console.error(error);
            setToastMessage("Network error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEndEmergency = async (id: number) => {
        Alert.alert(
            "End Emergency",
            "Are you sure this emergency is resolved?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Resolve",
                    style: 'destructive',
                    onPress: async () => {

                        setUrgencies(prev => prev.filter(u => u.id !== id));
                        setToastMessage("Emergency marked as resolved.");
                    }
                }
            ]
        );
    };

    const resetForm = () => {
        setFormName('');
        setFormDesc('');
        setFormLevel('1');
        setLocX('');
        setLocY('');
    };

    const getColorByLevel = (level: number) => {
        if (level >= 5) return theme.colors.error;
        if (level >= 3) return theme.colors.tertiary;
        return theme.colors.primary;
    };



    const renderItem = ({ item }: { item: Emergency }) => (
        <Card style={styles.card} mode="elevated">
            <Card.Title
                title={item.name}
                titleStyle={{ fontWeight: 'bold' }}
                subtitle={`ID: ${item.id} | Location: ${item.location_X.toFixed(4)}, ${item.location_Y.toFixed(4)}`}
                left={(props) => <Chip style={{ backgroundColor: getColorByLevel(item.level) }} textStyle={{ color: 'white' }}>{`Lvl ${item.level}`}</Chip>}
            />
            <Card.Content>
                <Text style={styles.description}>{item.description}</Text>
            </Card.Content>
            <Divider style={{ marginVertical: 10 }} />
            <Card.Actions>
                <Button
                    mode="contained-tonal"
                    textColor={theme.colors.error}
                    icon="alert-octagon"
                    onPress={() => handleEndEmergency(item.id)}
                >
                    End Emergency
                </Button>
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <Appbar.Header mode="center-aligned" elevated>
                <Appbar.Content title="Emergency Ops" subtitle="Live Control Center" />
                <Appbar.Action icon="refresh" onPress={handleRefreshUrgencies} />
            </Appbar.Header>

            {/* Main List */}
            <FlatList
                data={urgencies}
                keyExtractor={(item) => item.id ? item.id.toString() : Math.random().toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshing={refreshing}
                onRefresh={handleRefreshUrgencies}
                ListEmptyComponent={
                    !refreshing ? (
                        <View style={styles.emptyContainer}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>No active emergencies reported.</Text>
                        </View>
                    ) : null
                }
            />

            {/* Floating Action Button for New Reports */}
            <FAB
                icon="plus"
                label="New Report"
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                color="white"
                onPress={() => setModalVisible(true)}
            />

            {/* Report Modal */}
            <Portal>
                <Modal
                    visible={modalVisible}
                    onDismiss={() => setModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <ScrollView>
                        <Text style={styles.modalTitle}>Report New Emergency</Text>
                        <Divider style={{ marginBottom: 15 }} />

                        <TextInput
                            label="Emergency Name"
                            mode="outlined"
                            value={formName}
                            onChangeText={setFormName}
                            style={styles.input}
                            placeholder="e.g. Fire in Building A"
                        />

                        <TextInput
                            label="Description"
                            mode="outlined"
                            multiline
                            numberOfLines={3}
                            value={formDesc}
                            onChangeText={setFormDesc}
                            style={styles.input}
                        />

                        <View style={styles.row}>
                            <TextInput
                                label="Level (1-5)"
                                mode="outlined"
                                keyboardType="numeric"
                                value={formLevel}
                                onChangeText={setFormLevel}
                                style={[styles.input, { flex: 1, marginRight: 10 }]}
                            />
                            {/* Visual indicator of level */}
                            <View style={{ justifyContent: 'center', paddingBottom: 10 }}>
                                <Chip icon="alert">{`Severity: ${formLevel}`}</Chip>
                            </View>
                        </View>

                        <Text variant="labelLarge" style={{ marginTop: 10 }}>Location Coordinates</Text>
                        <View style={styles.row}>
                            <TextInput
                                label="Latitude (X)"
                                mode="outlined"
                                keyboardType="numeric"
                                value={locX}
                                onChangeText={setLocX}
                                style={[styles.input, { flex: 1, marginRight: 5 }]}
                            />
                            <TextInput
                                label="Longitude (Y)"
                                mode="outlined"
                                keyboardType="numeric"
                                value={locY}
                                onChangeText={setLocY}
                                style={[styles.input, { flex: 1, marginLeft: 5 }]}
                            />
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleCreateEmergency}
                            loading={submitting}
                            disabled={submitting}
                            style={styles.submitBtn}
                        >
                            Broadcast Alert
                        </Button>
                        <Button onPress={() => setModalVisible(false)} disabled={submitting}>
                            Cancel
                        </Button>
                    </ScrollView>
                </Modal>
            </Portal>

            {/* Feedback Snackbar */}
            <Snackbar
                visible={toastMessage !== null}
                onDismiss={() => setToastMessage(null)}
                duration={3000}
                action={{
                    label: 'OK',
                    onPress: () => setToastMessage(null),
                }}
            >
                {toastMessage}
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        backgroundColor: theme.colors.elevation.level3,
    },
    description: {
        marginTop: 8,
        color: theme.colors.onBackground,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },

    modalContainer: {
        backgroundColor: 'white',
        padding: 20,
        margin: 20,
        borderRadius: 8,
        maxHeight: '80%',
    },
    modalTitle: {
        textAlign: 'center',
        marginBottom: 10,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitBtn: {
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: theme.colors.error
    }
});

export default EmergencyDashboard;
import React, { useContext, useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Button, SafeAreaView, Platform, Alert } from 'react-native';
import { NameContext } from './NameContext'; 
import { ReminderContext } from './ReminderContext'; 
import Read from './ReadData'; 
import SpeakButton from './SpeakButton';
import { firestore } from './FireBaseServer';
import { collection, addDoc } from 'firebase/firestore';
import AudioRecorder from './AudioRecorder';
import { useNavigation } from '@react-navigation/native';
import { TextStyles } from './styles/TextStyles';

export default function ChangeText() {
    const { addReminder } = useContext(ReminderContext); 
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.mainContent}>
                <View style={styles.remindersSection}>
                    <View style={styles.remindersContainer}>
                        <Text style={styles.sectionTitle}>My Reminders</Text>
                        <Read />
                    </View>
                </View>

                <View style={styles.buttonsSection}>
                    <TouchableOpacity 
                        style={[styles.mainButton, styles.watcherButton]}
                        onPress={() => {
                            try {
                                navigation.navigate('LocationPicker');
                            } catch (error) {
                                console.error('Navigation error:', error);
                                Alert.alert(
                                    'Error',
                                    'Unable to open watcher view at this time',
                                    [{ text: 'OK' }]
                                );
                            }
                        }}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>I want to be a Watcher</Text>
                            <Text style={styles.description}>
                                Help guide someone by setting up routes and monitoring their journey
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.mainButton, styles.watchedButton]}
                        onPress={() => {
                            try {
                                navigation.navigate('WatchedView');
                            } catch (error) {
                                console.error('Navigation error:', error);
                                Alert.alert(
                                    'Error',
                                    'Unable to open watched view at this time',
                                    [{ text: 'OK' }]
                                );
                            }
                        }}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>I want to be Watched</Text>
                            <Text style={styles.description}>
                                Get assistance and guidance from a trusted person
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.mainButton, styles.reminderButton]}
                        onPress={() => {
                            try {
                                navigation.navigate('AddReminder');
                            } catch (error) {
                                console.error('Navigation error:', error);
                                Alert.alert(
                                    'Error',
                                    'Unable to open reminder screen at this time',
                                    [{ text: 'OK' }]
                                );
                            }
                        }}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Add a Reminder</Text>
                            <Text style={styles.description}>
                                Set up reminders for important tasks or medications
                            </Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.mainButton, styles.mapButton]}
                        onPress={() => {
                            try {
                                navigation.navigate('Map');
                            } catch (error) {
                                console.error('Navigation error:', error);
                                Alert.alert(
                                    'Error',
                                    'Unable to open map at this time',
                                    [{ text: 'OK' }]
                                );
                            }
                        }}
                    >
                        <View style={styles.buttonContent}>
                            <Text style={styles.buttonText}>Accessible Map</Text>
                            <Text style={styles.description}>
                                Find accessible locations near you
                            </Text>
                            <SpeakButton text="Go to an Accessible Map" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.audioSection}>
                <AudioRecorder />
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    mainContent: {
        flex: 1,
        flexDirection: 'row',
        padding: 20,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1A237E',
        marginBottom: 15,
        textAlign: 'center',
    },
    remindersSection: {
        flex: 1,
        marginRight: 20,
    },
    remindersContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 20,
        height: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    buttonsSection: {
        flex: 1,
        justifyContent: 'flex-start',
        gap: 15,
    },
    mainButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    watcherButton: {
        backgroundColor: '#2196F3',
    },
    watchedButton: {
        backgroundColor: '#4CAF50',
    },
    reminderButton: {
        backgroundColor: '#3F51B5',
    },
    mapButton: {
        backgroundColor: '#3F51B5',
    },
    buttonContent: {
        padding: 20,
        alignItems: 'center',
    },
    utilityButtonContent: {
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
    },
    description: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
    audioSection: {
        padding: 20,
        paddingTop: 0,
    },
    settingsTab: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 300,
        backgroundColor: 'white',
        padding: 20,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#333',
    },
    textSettingsHeader: {
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginBottom: 10,
    },
    textSettingsOptions: {
        paddingLeft: 10,
    },
    settingsItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    }
});

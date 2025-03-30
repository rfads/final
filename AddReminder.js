import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ReminderContext } from './ReminderContext';
import { firestore } from './FireBaseServer'; 
import { collection, addDoc } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 

//defining reminder class
class Reminder {
    constructor(name, date, time) {
        this.name = name;
        this.date = date;
        this.time = time;
    }
}

export default function AddReminder({ navigation }) {
    const [reminderName, setReminderName] = useState('');
    const [reminderDate, setReminderDate] = useState(new Date());
    const [reminderTime, setReminderTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const { addReminder } = useContext(ReminderContext);

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || reminderDate;
        setShowDatePicker(Platform.OS === 'ios');
        setReminderDate(currentDate);
    };

    const onTimeChange = (event, selectedTime) => {
        const currentTime = selectedTime || reminderTime;
        setShowTimePicker(Platform.OS === 'ios');
        setReminderTime(currentTime);
    };

   
    const getCurrentUser = () => {
        const auth = getAuth();
        return auth.currentUser; 
    };

    const saveReminder = async () => {
        const newReminder = new Reminder(reminderName, reminderDate, reminderTime);
        const user = getCurrentUser(); 
        if (user) {
            try {
                
                const docRef = await addDoc(collection(firestore, 'reminders'), {
                    userId: user.uid, 
                    name: newReminder.name,
                    date: newReminder.date.toISOString(), 
                    time: newReminder.time.toISOString(),
                });
                console.log("Reminder saved successfully");

                
                addReminder({ id: docRef.id, ...newReminder });
            } catch (error) {
                console.error("Error saving reminder:", error);
            }
        }
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <View style={styles.reminderSection}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter reminder name"
                    value={reminderName}
                    onChangeText={setReminderName}
                />

                
                {Platform.OS === 'web' ? (
                    <input
                        type="date"
                        value={reminderDate.toISOString().split('T')[0]} 
                        onChange={(e) => {
                            const dateValue = new Date(e.target.value);
                            if (dateValue instanceof Date && !isNaN(dateValue)) {
                                setReminderDate(dateValue); 
                            }
                        }}
                        style={styles.dateInput}
                    />
                ) : (
                    <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Text style={styles.dateButtonText}>
                            {reminderDate.toLocaleDateString()} 
                        </Text>
                    </TouchableOpacity>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={reminderDate}
                        mode="date"
                        onChange={onDateChange}
                    />
                )}

                
                {Platform.OS === 'web' ? (
                    <input
                        type="time"
                        value={reminderTime.toTimeString().split(' ')[0].slice(0, 5)} 
                        onChange={(e) => {
                            const timeValue = e.target.value.split(':');
                            const newTime = new Date(reminderTime);
                            newTime.setHours(timeValue[0]);
                            newTime.setMinutes(timeValue[1]);
                            setReminderTime(newTime);
                        }}
                        style={styles.timeInput}
                    />
                ) : (
                    <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>
                            {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {/* Display the selected time */}
                        </Text>
                    </TouchableOpacity>
                )}
                {showTimePicker && (
                    <DateTimePicker
                        value={reminderTime}
                        mode="time"
                        onChange={onTimeChange}
                    />
                )}

                <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={saveReminder}
                >
                    <Text style={styles.saveButtonText}>Save Reminder</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#333333',
        padding: 20,
    },
    reminderSection: {
        width: '100%',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 8,
        color: '#fff',
        width: '100%',
    },
    dateButton: {
        backgroundColor: '#444',
        padding: 10,
        borderRadius: 5,
        marginVertical: 5,
    },
    dateButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    dateInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 8,
        color: '#000',
        width: '100%',
    },
    timeButton: {
        marginBottom: 10,
        padding: 10,
        backgroundColor: '#28a745', // Button color for time picker
        borderRadius: 5,
        width: '100%',
    },
    timeButtonText: {
        color: '#fff',
        textAlign: 'center',
    },
    timeInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 10,
        paddingLeft: 8,
        color: '#000',
        width: '100%',
    },
    saveButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#28a745', // Button color for save
        borderRadius: 5,
        width: '100%',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
});

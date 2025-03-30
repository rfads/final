import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';

const CountdownReminder = ({ reminder }) => {
    const [timeLeft, setTimeLeft] = useState(reminder.dueTime - Date.now());
// Assuming `Time` is a timestamp or a string
const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'reminders'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      console.log('Fetched data:', data); // Log the fetched data
      setReminders(data);
    } catch (error) {
      console.error('Error fetching Firestore data:', error.message);
    }
  };
  
  // Countdown component logic
  const calculateCountdown = (timeString) => {
    if (!timeString) return "No time set";
  
    const eventTime = new Date(timeString).getTime(); // Parse the `Time` field
    const now = Date.now();
    const timeDifference = eventTime - now;
  
    if (timeDifference <= 0) return "Time's up!";
  
    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDifference / 1000) % 60);
  
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };
  

    return (
        <View style={styles.reminder}>
            <Text style={styles.reminderHeader}>{reminder.title}</Text>
            <Text style={styles.reminderDetails}>Time Remaining: {formatTime(timeLeft)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    reminder: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    reminderHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    reminderDetails: {
        fontSize: 16,
        color: '#555',
    },
});

export default CountdownReminder;

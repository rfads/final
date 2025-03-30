import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from './FireBaseServer';
import SpeakButton from './SpeakButton';

function Read() {
  const [reminders, setReminders] = useState([]);
  const [, setForceUpdate] = useState(0);

  //func to format date as dd/mm/yyyy
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  //func to format time as hh:mm am/pm
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  //func to fetch data from firestore
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'reminders'));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log('Fetched reminders:', data);
      setReminders(data);
    } catch (error) {
      console.error('Error fetching Firestore data:', error.message);
    }
  };

  //func to calculate the countdown time 
  const calculateCountdown = (dateString, timeString) => {
    if (!dateString || !timeString) return "No time set";

    // Combine date and time into one Date object
    const eventDate = new Date(dateString);
    const eventTime = new Date(timeString);
    
    // Create a combined date-time
    const combinedDateTime = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        eventTime.getHours(),
        eventTime.getMinutes(),
        eventTime.getSeconds()
    );

    const now = new Date();
    const timeDifference = combinedDateTime.getTime() - now.getTime();

    if (timeDifference <= 0) return "Time's up!";

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
    const seconds = Math.floor((timeDifference / 1000) % 60);

    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
  };

  
  const deleteReminder = async (id) => {
    try {
      const reminderRef = doc(firestore, 'reminders', id);
      await deleteDoc(reminderRef);
      console.log('Reminder deleted:', id);
      fetchData();
    } catch (error) {
      console.error('Error deleting Firestore data:', error.message);
    }
  };

  
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  
  useEffect(() => {
    fetchData();
    const refreshInterval = setInterval(fetchData, 60000);

    return () => clearInterval(refreshInterval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={fetchData} style={styles.button}>
          <Text style={styles.buttonText}>Show/Refresh Reminders</Text>
        </TouchableOpacity>
        <SpeakButton text="Show/Refresh Reminders" />
      </View>

      {reminders.length > 0 ? (
        reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminder}>
            <View style={styles.reminderHeaderContainer}>
              <Text style={styles.reminderHeader}>{reminder.name || 'No Name'}</Text>
              
            </View>
            <View style={styles.reminderDetails}>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderText}>
                  <Text style={styles.bold}>Date: </Text>
                  {formatDate(reminder.date) || 'N/A'}
                </Text>
                
              </View>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderText}>
                  <Text style={styles.bold}>Time: </Text>
                  {formatTime(reminder.time) || 'N/A'}
                </Text>
                
              </View>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderText}>
                  <Text style={styles.bold}>Countdown: </Text>
                  {calculateCountdown(reminder.date, reminder.time)}
                </Text>
                
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                onPress={() => deleteReminder(reminder.id)} 
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              <SpeakButton text="Delete" />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No reminders to display.</Text>
          
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
    marginLeft: 10,
  },
  reminderText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
    color: '#007BFF',
  },
  deleteButton: {
    marginTop: 15,
    backgroundColor: '#FF5733',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  reminderHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  noDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  }
});

export default Read;

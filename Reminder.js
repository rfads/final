import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore } from './FireBaseServer'; 
function Read() {
  const [reminders, setReminders] = useState([]);

  //formatting
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

 
  const formatTime = (timeString) => {
    const date = new Date(timeString);
    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    return `${hours}:${minutes} ${ampm}`;
  };

  //fetching the reminders from firestore
  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'reminders'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setReminders(data);
      console.log("Fetched reminders:", data);
    } catch (error) {
      console.error("Error fetching Firestore data:", error.message);
    }
  };

 //deleting the reminder from database
  const deleteReminder = async (id) => {
    try {
    
      Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this reminder?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: async () => {
              console.log("Attempting to delete reminder with id:", id);
              const reminderRef = doc(firestore, 'reminders', id);
              await deleteDoc(reminderRef);

              
              fetchData(); 
              console.log("Reminder deleted successfully");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error deleting reminder:", error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={fetchData} style={styles.button}>
        <Text style={styles.buttonText}>Fetch Reminders</Text>
      </TouchableOpacity>

      {reminders.length > 0 ? (
        reminders.map((item) => (
          <View key={item.id} style={styles.reminder}>
            <Text style={styles.reminderHeader}>{item.name || 'No Name'}</Text>
            <View style={styles.reminderDetails}>
              <Text style={styles.reminderText}><Text style={styles.bold}>Date: </Text>{formatDate(item.date) || 'N/A'}</Text>
              <Text style={styles.reminderText}><Text style={styles.bold}>Time: </Text>{formatTime(item.time) || 'N/A'}</Text>
            </View>

           
            <TouchableOpacity onPress={() => deleteReminder(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No reminders to display.</Text>
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
});

export default Read;

import React, { createContext, useState, useEffect } from 'react';
import { firestore } from './FireBaseServer';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Speech from 'expo-speech';

export const ReminderContext = createContext();

export const ReminderProvider = ({ children }) => {
    const [reminders, setReminders] = useState([]);

    const fetchReminders = async () => {
        try {
            const user = getAuth().currentUser;
            if (user) {
                const remindersRef = collection(firestore, 'reminders');
                const userRemindersQuery = query(remindersRef, where('userId', '==', user.uid));
                const querySnapshot = await getDocs(userRemindersQuery);
                const fetchedReminders = [];
                querySnapshot.forEach((doc) => {
                    fetchedReminders.push({ id: doc.id, ...doc.data() });
                });
                setReminders(fetchedReminders);
                console.log('Fetched reminders:', fetchedReminders);
            }
        } catch (error) {
            console.error('Error fetching reminders:', error);
            await Speech.speak('Failed to fetch reminders');
        }
    };

    const addReminder = async (reminder) => {
        try {
            setReminders((prevReminders) => [...prevReminders, reminder]);
            console.log('Added reminder:', reminder);
            await Speech.speak('Reminder added successfully');
        } catch (error) {
            console.error('Error adding reminder:', error);
            await Speech.speak('Failed to add reminder');
        }
    };

    const deleteReminder = async (reminderId) => {
        try {
            setReminders((prevReminders) => 
                prevReminders.filter(reminder => reminder.id !== reminderId)
            );
            console.log('Deleted reminder:', reminderId);
            await Speech.speak('Reminder deleted');
        } catch (error) {
            console.error('Error deleting reminder:', error);
            await Speech.speak('Failed to delete reminder');
        }
    };

    const updateReminder = async (reminderId, updatedData) => {
        try {
            setReminders((prevReminders) =>
                prevReminders.map(reminder =>
                    reminder.id === reminderId
                        ? { ...reminder, ...updatedData }
                        : reminder
                )
            );
            console.log('Updated reminder:', reminderId);
            await Speech.speak('Reminder updated');
        } catch (error) {
            console.error('Error updating reminder:', error);
            await Speech.speak('Failed to update reminder');
        }
    };

    useEffect(() => {
        fetchReminders();
        // Set up a refresh interval (every minute)
        const refreshInterval = setInterval(fetchReminders, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    return (
        <ReminderContext.Provider 
            value={{ 
                reminders, 
                addReminder, 
                deleteReminder, 
                updateReminder, 
                fetchReminders,
                setReminders 
            }}
        >
            {children}
        </ReminderContext.Provider>
    );
};
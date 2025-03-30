import React, { useState, useContext } from 'react';
import { View, Button, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { ReminderContext } from './ReminderContext';
import { getAuth } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import * as Speech from 'expo-speech';
import { firestore } from './FireBaseServer';

function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [message, setMessage] = useState('');
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { addReminder } = useContext(ReminderContext);
  const [isAddingReminder, setIsAddingReminder] = useState(false);

  const startRecording = async () => {
    try {
      console.log('Setting audio mode..');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      console.log('Creating recording');
      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      setRecording(recording);
      setMessage('Recording started - Speak clearly into the microphone');
      console.log('Recording started with PCM format');
    } catch (err) {
      console.error('Failed to start recording', err);
      setMessage('Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      console.error('No recording to stop');
      return;
    }

    try {
      console.log('Stopping recording..');
      const status = await recording.getStatusAsync();
      console.log('Final recording status:', status);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped and stored at', uri);

      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);
      console.log('File size:', fileInfo.size, 'bytes');

      if (fileInfo.size < 1000) {
        console.warn('Warning: Audio file is very small, might not contain valid audio data');
      }

      setMessage('Recording saved at: ' + uri);
      setLoading(true);
      await sendAudioToBackend(uri);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Failed to stop recording. Please try again.');
    } finally {
      setLoading(false);
      setRecording(null);
    }
  };

  const handleVoiceCommand = (text) => {
    const command = text.toLowerCase().trim();
    console.log('Received command:', command);
    
    // Make pattern more flexible to handle articles and punctuation
    const reminderPattern = /^add(?:\s+a)?\s+reminder[\s,\.]*(.+?)(?:\s+at|,\s*at)\s+(.+?)(?:\s+at|,\s*at)\s+(.+)$/i;
    const isReminderCreation = reminderPattern.test(command);
    console.log('Is reminder creation command:', isReminderCreation);

    if (isReminderCreation) {
      try {
        console.log('Attempting to parse reminder details');
        const reminderDetails = parseReminderCommand(text);
        console.log('Parsed reminder details:', reminderDetails);
        
        if (reminderDetails) {
          createNewReminder(reminderDetails);
          setMessage('Reminder created successfully!');
          return;
        } else {
          setMessage('Could not understand reminder details. Please try again with format: "add reminder [name] at [date] at [time]"');
          return;
        }
      } catch (error) {
        console.error('Error parsing reminder:', error);
        setMessage('Error creating reminder. Please try again.');
        return;
      }
    }

    // Modified navigation switch to be more specific
    switch (true) {
      case /^(open |show |go to )?watcher( view)?$/i.test(command):
        navigation.navigate('LocationPicker');
        setMessage('Navigating to Watcher view...');
        break;
      
      case /^(i want to be |show |go to )?watched( view)?$/i.test(command):
        navigation.navigate('WatchedView');
        setMessage('Navigating to Watched view...');
        break;
      
      case /^(open |show |go to )?map$/i.test(command):
        navigation.navigate('Map');
        setMessage('Opening Accessible Map...');
        break;
      
      case /^(open |show |go to )?reminder$/i.test(command):
        navigation.navigate('AddReminder');
        setMessage('Navigating to Add Reminder...');
        break;
      
      default:
        setMessage('Command not recognized. Try saying: "watcher", "watched", "add reminder [name] at [date] at [time]", or "map"');
    }
  };

  const parseReminderCommand = (text) => {
    console.log('Parsing reminder command:', text);
    // Use the same flexible pattern here
    const reminderRegex = /^add(?:\s+a)?\s+reminder[\s,\.]*(.+?)(?:\s+at|,\s*at)\s+(.+?)(?:\s+at|,\s*at)\s+(.+)$/i;
    const match = text.match(reminderRegex);
    console.log('Regex match result:', match);

    if (match) {
      const [_, name, dateStr, timeStr] = match;
      // Clean up the extracted strings
      const cleanName = name.replace(/[,\.]+/g, '').trim();
      const cleanDateStr = dateStr.replace(/[,\.]+/g, '').trim();
      const cleanTimeStr = timeStr.replace(/[,\.]+/g, '').trim();
      
      console.log('Cleaned parts:', { cleanName, cleanDateStr, cleanTimeStr });
      
      try {
        const parsedDate = parseDate(cleanDateStr);
        const parsedTime = parseTime(cleanTimeStr);
        console.log('Parsed date and time:', { parsedDate, parsedTime });

        if (parsedDate && parsedTime) {
          const reminderDate = new Date(parsedDate);
          reminderDate.setHours(parsedTime.getHours());
          reminderDate.setMinutes(parsedTime.getMinutes());

          return {
            name: cleanName,
            date: parsedDate,
            time: reminderDate
          };
        }
      } catch (error) {
        console.error('Error parsing date/time:', error);
      }
    }
    return null;
  };

  const parseDate = (dateStr) => {
    dateStr = dateStr.toLowerCase().trim();
    
    if (dateStr === 'today') {
      return new Date();
    } else if (dateStr === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    throw new Error('Could not parse date');
  };

  const parseTime = (timeStr) => {
    timeStr = timeStr.toLowerCase().trim();
    
    const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
    const match = timeStr.match(timeRegex);

    if (match) {
      const [_, hours, minutes = '0', meridiem] = match;
      let parsedHours = parseInt(hours);
      const parsedMinutes = parseInt(minutes);

      if (meridiem) {
        if (meridiem.toLowerCase() === 'pm' && parsedHours < 12) {
          parsedHours += 12;
        } else if (meridiem.toLowerCase() === 'am' && parsedHours === 12) {
          parsedHours = 0;
        }
      }

      const time = new Date();
      time.setHours(parsedHours, parsedMinutes, 0);
      return time;
    }

    throw new Error('Could not parse time');
  };

  const createNewReminder = async (reminderDetails) => {
    try {
      const user = getAuth().currentUser;
      if (user) {
        const docRef = await addDoc(collection(firestore, 'reminders'), {
          userId: user.uid,
          name: reminderDetails.name,
          date: reminderDetails.date.toISOString(),
          time: reminderDetails.time.toISOString(),
        });
        
        addReminder({ 
          id: docRef.id, 
          ...reminderDetails 
        });
        
        await Speech.speak('Reminder created successfully');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      await Speech.speak('Failed to create reminder');
    }
  };

  const sendAudioToBackend = async (audioUri) => {
    if (!audioUri) {
      console.error('No audio URI provided');
      return;
    }

    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      name: 'audio.wav',
      type: 'audio/wav',
    });

    try {
      console.log('Sending audio to backend:', audioUri);
      const response = await axios.post('http://192.168.31.203:3000/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        transformRequest: (data, headers) => {
          return formData;
        },
      });
      console.log('Response from server:', response.data);
      setTranscription(response.data.transcription);
      handleVoiceCommand(response.data.transcription);
    } catch (error) {
      console.error('Error uploading audio:', error.response || error);
      alert('Failed to upload audio. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.bigButton}
        onPress={recording ? stopRecording : startRecording}
        accessibilityLabel={recording ? "Stop voice command" : "Start voice command"}
        accessibilityHint="Double tap to start or stop voice recording"
      >
        <Text style={styles.bigButtonText}>
          {recording ? 'Stop Voice Command' : 'Start Voice Command'}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.messageContainer}>
        {loading && <ActivityIndicator size="large" color="#0000ff" />}
        <Text style={styles.messageText}>{message}</Text>
        <Text style={styles.messageText}>Transcription: {transcription}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 'auto',
    minHeight: 200,
    maxHeight: 300, // Limit maximum height
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'transparent',
  },
  bigButton: {
    width: '100%',
    height: 100, // Reduced height
    backgroundColor: '#2196F3',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 10, // Reduced margin
  },
  bigButtonText: {
    color: '#FFFFFF',
    fontSize: 24, // Slightly smaller font
    fontWeight: 'bold',
    textAlign: 'center',
  },
  messageContainer: {
    width: '100%',
    maxHeight: 150, // Limit message container height
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    overflow: 'hidden', // Hide overflow content
  },
  messageText: {
    fontSize: 16, // Smaller font size
    marginTop: 5, // Reduced margin
    textAlign: 'center',
    color: '#333',
  },
});

export default AudioRecorder;
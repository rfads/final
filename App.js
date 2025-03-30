import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChangeText from './components/ChangeText';
import ViewImage from './components/ViewImage';
import DisabilityPicker from './components/DisabilityPicker';
import Greetings from './components/Greetings';
import AddReminder from './components/AddReminder';

import { ReminderProvider } from './components/ReminderContext';
import { NameProvider } from './components/NameContext';
import LoginScreen from './components/FireScreens/LoginScreen';
import WelcomeScreen from './components/FireScreens/WelcomeScreen';
import Map from './components/Map';
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from './components/FireScreens/AuthContext';
import GuestStack from './components/FireScreens/GuestStack';
import AppStack from './components/FireScreens/AppStack';
import AccessiblePlaces from './components/AccessiblePlaces';

LogBox.ignoreLogs(["Warning:...."]);
LogBox.ignoreAllLogs();

const Stack = createStackNavigator();

const AppContent = () => {
    const { loggedInUser } = useAuth();
    console.log('loggedInUser:', loggedInUser);
    
    return (
        <Stack.Navigator>
            {loggedInUser ? (
                <Stack.Screen name="AppStack" component={AppStack} options={{ headerShown: false }} />
            ) : (
                <Stack.Screen name="GuestStack" component={GuestStack} options={{ headerShown: false }} />
            )}
            <Stack.Screen name="Greetings" component={Greetings} />
            <Stack.Screen name="DisabilityPicker" component={DisabilityPicker} />
            <Stack.Screen name="ChangeText" component={ChangeText} />
            <Stack.Screen name="AddReminder" component={AddReminder} />
            <Stack.Screen name="ViewImage" component={ViewImage} />
            <Stack.Screen name="Map" component={Map} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
                name="AccessiblePlaces" 
                component={AccessiblePlaces} 
                options={{
                    headerShown: false, // Hide the header to maximize screen space
                    title: 'Accessible Places', // Optionally set a title here
                }} 
            />
        </Stack.Navigator>
    );
};

export default function App() {
    const [isFirstLaunch, setIsFirstLaunch] = useState(null);

    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                if (hasLaunched === null) {
                    setIsFirstLaunch(true);
                    await AsyncStorage.setItem('hasLaunched', 'true');
                } else {
                    setIsFirstLaunch(false);
                }
            } catch (error) {
                console.error("Error checking first launch:", error);
                setIsFirstLaunch(false);
            }
        };

        checkFirstLaunch();
    }, []);

    return (
        <AuthProvider>
            <NameProvider>
                <ReminderProvider>
                    <NavigationContainer>
                        <AppContent />
                    </NavigationContainer>
                </ReminderProvider>
            </NameProvider>
        </AuthProvider>
    );
}

const styles = {
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
};

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./LoginScreen";
import WelcomeScreen from "./WelcomeScreen";
import SignUpScreeb from "./SignUpScreen";
const Stack = createNativeStackNavigator();

const GuestStack = () =>{
    return (
        <Stack.Navigator>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options ={{headerShown:false}} />
            <Stack.Screen name="Login" component={LoginScreen}options ={{headerShown:true}} />
            <Stack.Screen name="SignUp" component={SignUpScreeb} options ={{headerShown:true}}/>
        </Stack.Navigator>
    )
}
export default GuestStack;
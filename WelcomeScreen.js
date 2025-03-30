import React from "react";
import {SafeAreaView,Text,TouchableOpacity} from "react-native";
import styles from  './WelcomeScreenStyles';

const WelcomeScreen = ({navigation}) => {
    return (
        <SafeAreaView style = {styles.container}>
            <Text style = {styles.title}>Hello and welcome to my App</Text>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    navigation.navigate("Login");
                }}
            >
                <Text>Existing User Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    navigation.navigate("SignUp");
                }}
            >
                <Text>New User Sign Up</Text>
            </TouchableOpacity>
        </SafeAreaView>
    )
}
export default WelcomeScreen;
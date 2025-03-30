import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { auth, firestore } from "../FireBaseServer";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import styles from "./SignUpScreenStyles";
import { InputStyles } from "../styles/InputStyles";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      console.log("Sign up successful:", userCredential.user.uid);
    } catch (error) {
      console.error("Sign up error:", error);
      switch (error.code) {
        case "auth/email-already-in-use":
          setError("Email already in use");
          break;
        case "auth/invalid-email":
          setError("Invalid email address");
          break;
        case "auth/weak-password":
          setError("Password is too weak");
          break;
        default:
          setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern} />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.welcomeText}>Join us to start your journey</Text>

        <View style={InputStyles.inputContainer}>
          <Text style={InputStyles.label}>Email</Text>
          <TextInput
            style={InputStyles.input}
            placeholder="Enter your email"
            placeholderTextColor="#adb5bd"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={InputStyles.inputContainer}>
          <Text style={InputStyles.label}>Password</Text>
          <TextInput
            style={InputStyles.input}
            placeholder="Create password"
            placeholderTextColor="#adb5bd"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={InputStyles.inputContainer}>
          <Text style={InputStyles.label}>Confirm Password</Text>
          <TextInput
            style={InputStyles.input}
            placeholder="Confirm password"
            placeholderTextColor="#adb5bd"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.downText}>
            Already have an account? <Text style={styles.signupText}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUpScreen;
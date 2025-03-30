import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0", // Light background color
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        color: "#333", // Dark text color
    },
    button: {
        backgroundColor: "#007BFF", // Button color
        padding: 10,
        borderRadius: 5,
        marginVertical: 10,
        width: "80%", // Button width
        alignItems: "center",
    },
    buttonText: {
        color: "#fff", // Button text color
        fontSize: 16,
    },
    logo: {
        width: 100, // Adjust width as needed
        height: 100, // Adjust height as needed
        marginBottom: 20, // Space below the logo
    },
});

export default styles;

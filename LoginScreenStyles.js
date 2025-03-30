import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000000', // Solid black background
    },
    backgroundPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: height * 0.3,
        backgroundColor: '#111111', // Very dark gray for subtle contrast
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 400,
        padding: 25,
        backgroundColor: '#111111', // Dark content container
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#222222', // Subtle border
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ffffff', // White text
        marginBottom: 30,
        textAlign: 'center',
    },
    welcomeText: {
        fontSize: 16,
        color: '#999999', // Light gray text
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 22,
    },
    logo: {
        width: 100, // Adjust width as needed
        height: 100, // Adjust height as needed
        marginBottom: 20, // Space below the logo
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#333', // Dark color for labels
        alignSelf: 'flex-start', // Align labels to the start
    },
    input: {
        height: 50,
        width: '100%',
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        marginTop: 10,
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    downText: {
        marginTop: 25,
        fontSize: 14,
        color: '#999999', // Light gray text
        textAlign: 'center',
    },
    signupText: {
        color: '#007AFF',
        fontWeight: '600',
    },
    errorText: {
        color: '#ff4444', // Brighter red for dark theme
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
    },
});

export default styles;

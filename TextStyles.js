import { StyleSheet, Platform } from 'react-native';

export const TextStyles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  bodyText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  caption: {
    fontSize: 14,
    color: '#7F8C8D',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  alertText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E74C3C',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  successText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#27AE60',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  }
}); 
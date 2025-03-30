import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { firestore } from './FireBaseServer';
import { collection, addDoc, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from './FireScreens/AuthContext';
import * as Location from 'expo-location';
import LocationPicker from './LocationPicker';
import { TextStyles } from './styles/TextStyles';
import * as Speech from 'expo-speech';
import { MaterialIcons } from '@expo/vector-icons';

const WatchedView = () => {
  const { loggedInUser } = useAuth();
  const [watchKey, setWatchKey] = useState('');
  const [isWatched, setIsWatched] = useState(false);
  const [watchedUserData, setWatchedUserData] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [lastSpokenUpdate, setLastSpokenUpdate] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [lastLocation, setLastLocation] = useState(null);
  const [obstacles, setObstacles] = useState([]);
  const [nearbyObstacles, setNearbyObstacles] = useState([]);
  const [lastObstacleWarning, setLastObstacleWarning] = useState({});
  const [currentDirection, setCurrentDirection] = useState(null);
  const [nextTurn, setNextTurn] = useState(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
      }
    };

    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (loggedInUser) {
      const watchedRef = collection(firestore, 'watched_users');
      const unsubscribe = onSnapshot(watchedRef, (snapshot) => {
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.userId === loggedInUser.uid && data.isActive) {
            console.log('Received watched user data:', data);
            setWatchedUserData({ id: doc.id, ...data });
            setIsWatched(true);
            setWatchKey(data.watchKey);
            if (data.assignedRoute) {
              console.log('Route info updated:', data.assignedRoute);
              setRouteInfo(data.assignedRoute);
            }
            setIsNavigating(data.isNavigating || false);
          }
        });
      });

      return () => unsubscribe();
    }
  }, [loggedInUser]);

  useEffect(() => {
    let locationSubscription;

    const startLocationTracking = async () => {
      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1
          },
          async (location) => {
            if (!location?.coords?.latitude || !location?.coords?.longitude) {
              console.log('Invalid location data received');
              return;
            }

            const newLocation = {
              latitude: Number(location.coords.latitude),
              longitude: Number(location.coords.longitude),
              timestamp: location.timestamp
            };

            // Validate coordinates before setting state
            if (!isNaN(newLocation.latitude) && !isNaN(newLocation.longitude)) {
              setCurrentLocation(newLocation);

              // Check for nearby obstacles immediately with each location update
              checkNearbyObstacles(newLocation);

              // If navigating, update guidance immediately with new location
              if (isNavigating && routeInfo?.steps) {
                provideNavigationGuidance(newLocation, routeInfo.steps);
              }

              // Update location in Firestore
              if (watchedUserData) {
                try {
                  await updateDoc(doc(firestore, 'watched_users', watchedUserData.id), {
                    currentLocation: newLocation
                  });
                } catch (error) {
                  console.error('Error updating location:', error);
                }
              }
            }
          }
        );

        setLocationSubscription(subscription);
      } catch (error) {
        console.error('Error starting location tracking:', error);
        Alert.alert('Error', 'Failed to start location tracking');
      }
    };

    if (isWatched && watchedUserData) {
      startLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isWatched, watchedUserData, isNavigating, routeInfo]);

  useEffect(() => {
    console.log('WatchedUserData updated:', watchedUserData);
    if (watchedUserData?.assignedRoute) {
      console.log('Route info received:', watchedUserData.assignedRoute);
      setRouteInfo(watchedUserData.assignedRoute);
    }
  }, [watchedUserData]);

  const generateWatchKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 6; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  };

  const startBeingWatched = async () => {
    if (!loggedInUser) {
      Alert.alert('Error', 'You must be logged in to be watched');
      return;
    }

    try {
      const newWatchKey = generateWatchKey();
      const watchedRef = collection(firestore, 'watched_users');
      const watchedDoc = await addDoc(watchedRef, {
        userId: loggedInUser.uid,
        watchKey: newWatchKey,
        isActive: true,
        isWatcherConnected: false,
        currentLocation: null,
        createdAt: new Date().toISOString()
      });

      setWatchedUserData({ id: watchedDoc.id, watchKey: newWatchKey });
      setWatchKey(newWatchKey);
      setIsWatched(true);
    } catch (error) {
      console.error('Error starting watch:', error);
      Alert.alert('Error', 'Failed to start being watched');
    }
  };

  const stopBeingWatched = async () => {
    if (watchedUserData) {
      try {
        // Stop navigation first
        setIsNavigating(false);
        
        await updateDoc(doc(firestore, 'watched_users', watchedUserData.id), {
          isActive: false,
          isNavigating: false, // Add this to ensure navigation is stopped
          endedAt: new Date().toISOString()
        });

        setWatchedUserData(null);
        setWatchKey('');
        setIsWatched(false);
        stopLocationTracking();
      } catch (error) {
        console.error('Error stopping watch:', error);
        Alert.alert('Error', 'Failed to stop being watched');
      }
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const calculateBearing = (startLat, startLng, destLat, destLng) => {
    const startLatRad = startLat * Math.PI / 180;
    const startLngRad = startLng * Math.PI / 180;
    const destLatRad = destLat * Math.PI / 180;
    const destLngRad = destLng * Math.PI / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    return bearing;
  };

  const getDirectionFromBearing = (bearing) => {
    if (bearing >= 337.5 || bearing < 22.5) return 'straight ahead';
    if (bearing >= 22.5 && bearing < 67.5) return 'slightly right';
    if (bearing >= 67.5 && bearing < 112.5) return 'right';
    if (bearing >= 112.5 && bearing < 157.5) return 'sharp right';
    if (bearing >= 157.5 && bearing < 202.5) return 'behind you';
    if (bearing >= 202.5 && bearing < 247.5) return 'sharp left';
    if (bearing >= 247.5 && bearing < 292.5) return 'left';
    if (bearing >= 292.5 && bearing < 337.5) return 'slightly left';
    return 'unknown direction';
  };

  const provideNavigationGuidance = (currentLocation, steps) => {
    if (!currentLocation || !steps || steps.length === 0) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep) return;

    // Calculate distance to next turn/point
    const distanceToNext = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      currentStep.endLocation.latitude,
      currentStep.endLocation.longitude
    );

    // Calculate bearing to next point
    const bearing = calculateBearing(
      currentLocation.latitude,
      currentLocation.longitude,
      currentStep.endLocation.latitude,
      currentStep.endLocation.longitude
    );

    const direction = getDirectionFromBearing(bearing);

    // Prepare navigation message based on distance and direction
    let message = '';

    if (distanceToNext <= 2) {
      // Very close to turn point
      if (currentStepIndex < steps.length - 1) {
        const nextStep = steps[currentStepIndex + 1];
        message = `Turn ${direction} now. Next, ${nextStep.instruction}`;
        setCurrentStepIndex(prev => prev + 1);
      } else {
        message = "You have reached your destination";
      }
    } else if (distanceToNext <= 5) {
      // Approaching turn point
      message = `In ${Math.round(distanceToNext)} meters, turn ${direction}. ${currentStep.instruction}`;
    } else {
      // Regular updates
      message = `Continue ${direction} for ${Math.round(distanceToNext)} meters`;
    }

    // Check for obstacles in the path
    const nearbyObstacle = obstacles.find(obstacle => {
      const obstacleDistance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        obstacle.location.latitude,
        obstacle.location.longitude
      );
      return obstacleDistance <= 5;
    });

    if (nearbyObstacle) {
      message += `. Caution: ${nearbyObstacle.description} nearby`;
    }

    // Speak the navigation instruction
    Speech.speak(message, {
      language: 'en',
      pitch: 1,
      rate: 0.8,
    });

    setCurrentDirection(direction);
    setNextTurn(currentStep.instruction);
  };

  useEffect(() => {
    let navigationInterval;

    if (isNavigating && currentLocation && watchedUserData?.assignedRoute?.steps) {
      // Initial guidance
      provideNavigationGuidance(currentLocation, watchedUserData.assignedRoute.steps);

      // Set up interval for continuous guidance
      navigationInterval = setInterval(() => {
        provideNavigationGuidance(currentLocation, watchedUserData.assignedRoute.steps);
      }, 2000);
    }

    return () => {
      if (navigationInterval) {
        clearInterval(navigationInterval);
      }
    };
  }, [isNavigating, currentLocation, watchedUserData?.assignedRoute, currentStepIndex]);

  useEffect(() => {
    if (currentLocation && lastLocation) {
      const distance = calculateDistance(
        lastLocation.latitude,
        lastLocation.longitude,
        currentLocation.latitude,
        currentLocation.longitude
      );

      // If moved more than 5 meters
      if (distance > 5) {
        setLastLocation(currentLocation);
        if (isNavigating && routeInfo?.steps) {
          provideNavigationGuidance(currentLocation, routeInfo.steps);
        }
      }
    } else if (currentLocation) {
      setLastLocation(currentLocation);
    }
  }, [currentLocation]);

  const checkNearbyObstacles = (currentLocation) => {
    if (!currentLocation) return;

    obstacles.forEach(obstacle => {
      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        obstacle.location.latitude,
        obstacle.location.longitude
      );

      const bearing = calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        obstacle.location.latitude,
        obstacle.location.longitude
      );
      const direction = getDirectionFromBearing(bearing);

      // Different warning levels based on distance
      if (distance < 5) { // Immediate danger zone
        // Warn immediately regardless of last warning time
        const warningMessage = `STOP! ${obstacle.description} directly ${direction}, extremely close!`;
        Speech.speak(warningMessage, {
          language: 'en',
          pitch: 1.2, // Higher pitch for urgency
          rate: 1, // Faster rate for urgency
        });

        if (isNavigating) {
          setCurrentDirection(prev => 
            `⚠️ DANGER! ${obstacle.description} extremely close ${direction}`
          );
        }
      } 
      else if (distance < 10 && (!lastObstacleWarning[obstacle.id] || 
          Date.now() - lastObstacleWarning[obstacle.id] > 15000)) { // Medium danger zone
        const warningMessage = `Warning! ${obstacle.description} very close, ${Math.round(distance)} meters ${direction}`;
        Speech.speak(warningMessage, {
          language: 'en',
          pitch: 1.1,
          rate: 0.9,
        });

        setLastObstacleWarning(prev => ({
          ...prev,
          [obstacle.id]: Date.now()
        }));

        if (isNavigating) {
          setCurrentDirection(prev => 
            `${prev || ''}\n⚠️ ${obstacle.description} very close ${direction}`
          );
        }
      }
      else if (distance < 20 && (!lastObstacleWarning[obstacle.id] || 
          Date.now() - lastObstacleWarning[obstacle.id] > 30000)) { // Warning zone
        const warningMessage = `Caution! There is ${obstacle.description} ${Math.round(distance)} meters ${direction} from you`;
        Speech.speak(warningMessage, {
          language: 'en',
          pitch: 1,
          rate: 0.8,
        });

        setLastObstacleWarning(prev => ({
          ...prev,
          [obstacle.id]: Date.now()
        }));

        if (isNavigating) {
          setCurrentDirection(prev => 
            `${prev || ''}\n⚠️ ${obstacle.description} nearby ${direction}`
          );
        }
      }
    });
  };

  useEffect(() => {
    if (!loggedInUser) return;

    const obstaclesRef = collection(firestore, 'obstacles');
    
    const unsubscribe = onSnapshot(obstaclesRef, (snapshot) => {
      const loadedObstacles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setObstacles(loadedObstacles);
    });

    return () => unsubscribe();
  }, [loggedInUser]);

  useEffect(() => {
    if (currentLocation) {
      checkNearbyObstacles(currentLocation);
    }
  }, [currentLocation, obstacles]);

  const NavigationStatus = () => {
    if (!routeInfo?.steps) return null;

    return (
      <View style={styles.navigationControlsContainer}>
        {isNavigating && currentDirection && (
          <View style={styles.directionContainer}>
            <Text style={styles.directionText}>
              Navigation Active
            </Text>
            <Text style={styles.directionText}>
              Current Direction: {currentDirection}
            </Text>
            {nextTurn && (
              <Text style={styles.nextTurnText}>
                Next: {nextTurn}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!isWatched ? (
        <View style={styles.startContainer}>
          <Text style={TextStyles.header}>Start Being Watched</Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={startBeingWatched}
          >
            <Text style={TextStyles.buttonText}>Generate Watch Key</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.watchedContainer}>
          <View style={styles.keyContainer}>
            <Text style={TextStyles.header}>Your Watch Key:</Text>
            <Text style={styles.watchKey}>{watchKey}</Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopBeingWatched}
            >
              <Text style={TextStyles.buttonText}>Stop Being Watched</Text>
            </TouchableOpacity>
          </View>

          {currentLocation && (
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>
                Current Location: {'\n'}
                Latitude: {currentLocation.latitude.toFixed(6)}{'\n'}
                Longitude: {currentLocation.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          {routeInfo && (
            <View style={styles.routeInfoContainer}>
              <Text style={styles.routeInfoTitle}>Route Information:</Text>
              <Text style={styles.routeInfoText}>
                Distance: {routeInfo.distance}{'\n'}
                Duration: {routeInfo.duration}
              </Text>
              <NavigationStatus />
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchedContainer: {
    flex: 1,
  },
  keyContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  watchKey: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#007AFF',
  },
  locationContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    lineHeight: 24,
  },
  routeInfoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  routeInfoText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 10,
    color: '#666',
  },
  navigationControlsContainer: {
    position: 'absolute',
    bottom: -200,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  directionContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  directionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nextTurnText: {
    fontSize: 14,
    color: '#666',
  },
  obstacleButton: {
    backgroundColor: '#FFA500',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  obstacleMarker: {
    backgroundColor: 'yellow',
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default WatchedView;
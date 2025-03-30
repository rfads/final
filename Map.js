// stuff we need to import
import React, { useState, useEffect } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDsYG6T39ZhP6D83HUoVF1d70RllQdnq2Q';

// where the map starts (israel)
const initialRegion = {
  latitude: 31.964819,
  longitude: 34.810864,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

function Map() {
  // bunch of states we need for the map to work
  const [places, setPlaces] = useState([]);
  const [mapRef, setMapRef] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);

  // load places when component mounts
  useEffect(() => {
    fetchAccessiblePlaces();
  }, []);

  // this function gets all the wheelchair places nearby
  const fetchAccessiblePlaces = async () => {
    console.log('starting search for accessible places...');
    console.log('search params:', {
      latitude: initialRegion.latitude, 
      longitude: initialRegion.longitude,
      radius: '1.5km'
    });

    setLoading(true);
    setErrorMsg(null);
    try {
      // Use your actual IP address for iOS
      const baseUrl = Platform.select({
        ios: 'http://192.168.31.203:3000', // Replace YOUR_IP_ADDRESS with your actual IP
        android: 'http://10.0.2.2:3000',
        default: 'http://localhost:3000'
      });
      
      console.log('making api request to:', baseUrl);
      
      // get the places from google
      const response = await axios.get(`${baseUrl}/api/places`, {
        params: {
          lat: initialRegion.latitude,
          lng: initialRegion.longitude,
          radius: 1500, // 1.5km radius search
          keyword: 'wheelchair accessible handicap'
        },
      });

      console.log('api response received:', {
        status: response.status,
        totalPlaces: response.data.results?.length || 0
      });

      // if we found places, show them on map
      if (response.data.results && response.data.results.length > 0) {
        console.log('places found:', response.data.results.length);
        console.log('first 3 places:', response.data.results.slice(0,3).map(place => ({
          name: place.name,
          address: place.vicinity,
          rating: place.rating
        })));
        
        setPlaces(response.data.results);
        
        // make the map show all the places we found
        if (mapRef && !showList) {
          console.log('updating map view with markers');
          const markers = response.data.results.map(place => ({
            latitude: Number(place.geometry.location.lat),
            longitude: Number(place.geometry.location.lng),
          }));
          
          mapRef.fitToCoordinates(markers, {
            edgePadding: { top: 70, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
          console.log('map view updated successfully');
        }
      } else {
        console.log('no places found in search results');
        setPlaces([]);
        setErrorMsg('No accessible places found nearby');
      }
    } catch (error) {
      console.error('error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      setErrorMsg('Unable to fetch accessible places. Please try again.');
    } finally {
      console.log('search completed');
      setLoading(false);
    }
  };

  // switches between map and list view
  const toggleView = () => {
    setShowList(!showList);
    setMapKey(prev => prev + 1);
    if (!showList && mapRef) {
      const markers = places.map(place => ({
        latitude: Number(place.geometry.location.lat),
        longitude: Number(place.geometry.location.lng),
      }));
      
      // wait a bit so map doesnt break
      setTimeout(() => {
        mapRef.fitToCoordinates(markers, {
          edgePadding: { top: 70, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 100);
    }
  };

  // shows all places in a list instead of map
  const renderListView = () => {
    if (places.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No accessible places found</Text>
        </View>
      );
    }

    // make a scrollable list of all places
    return (
      <ScrollView style={styles.listContainer}>
        {places.map((place) => (
          <TouchableOpacity 
            key={place.place_id} 
            style={styles.placeCard}
            onPress={() => {
              setShowList(false);
              // zoom to place when clicked
              setTimeout(() => {
                mapRef?.animateToRegion({
                  latitude: Number(place.geometry.location.lat),
                  longitude: Number(place.geometry.location.lng),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }, 100);
            }}
          >
            <Text style={styles.placeName}>{place.name}</Text>
            <Text style={styles.placeVicinity}>{place.vicinity}</Text>
            {place.rating && (
              <Text style={styles.placeRating}>Rating: {place.rating} ⭐</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const searchNearbyPlaces = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Use your actual IP address for iOS
      const baseUrl = Platform.select({
        ios: 'http://192.168.31.203:3000', // Keep your IP address here
        android: 'http://10.0.2.2:3000',
        default: 'http://localhost:3000'
      });
      
      console.log('making api request to:', baseUrl);
      
      const response = await axios.get(`${baseUrl}/api/places`, {
        params: {
          lat: initialRegion.latitude,
          lng: initialRegion.longitude,
          radius: 1500,
          type: searchQuery.toLowerCase(),
          keyword: 'wheelchair accessible handicap'
        },
      });

      console.log('api response received:', {
        status: response.status,
        totalPlaces: response.data.results?.length || 0
      });

      if (response.data.results && response.data.results.length > 0) {
        console.log('places found:', response.data.results.length);
        setPlaces(response.data.results);
        
        if (mapRef && !showList) {
          const markers = response.data.results.map(place => ({
            latitude: Number(place.geometry.location.lat),
            longitude: Number(place.geometry.location.lng),
          }));
          
          mapRef.fitToCoordinates(markers, {
            edgePadding: { top: 70, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        console.log('no places found in search results');
        setPlaces([]);
        setErrorMsg('No accessible places found nearby');
      }
    } catch (error) {
      console.error('Search error:', {
        message: error.message,
        code: error.code,
        response: error.response?.data
      });
      setErrorMsg('Unable to fetch places. Please try again.');
      Alert.alert(
        'Error',
        'Failed to search places. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // all the stuff that shows on screen
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search nearby places..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchNearbyPlaces}
        />
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={searchNearbyPlaces}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={styles.toggleButton} 
        onPress={toggleView}
      >
        <Text style={styles.toggleButtonText}>
          {showList ? 'Show Map' : 'Show List'}
        </Text>
      </TouchableOpacity>

      {/* either show list or map */}
      {showList ? (
        renderListView()
      ) : (
        <View style={StyleSheet.absoluteFillObject}>
          <MapView
            key={mapKey}
            ref={setMapRef}
            provider={Platform.OS === 'android' ? 'google' : undefined}
            style={StyleSheet.absoluteFillObject}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton
          >
            {places.map((place) => (
              <Marker
                key={place.place_id}
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }}
                title={place.name}
                description={place.vicinity}
              />
            ))}
          </MapView>
        </View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    margin: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 60,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
  },
  toggleButton: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    zIndex: 1,
  },
  toggleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    marginTop: 110,
    padding: 10,
  },
  placeCard: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  placeVicinity: {
    fontSize: 14,
    color: '#666',
  },
  placeRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 6,
    borderColor: '#ccc',
    borderWidth: 0.5,
    padding: 15,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  calloutText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  loaderContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 2,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 150,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
  },
});

// export with memo to prevent unnecessary rerenders
export default React.memo(Map);
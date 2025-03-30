import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

function NativeMap({ currentRegion, places, selectedPlace, setSelectedPlace }) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={currentRegion}
    >
      {places.map((place) => (
        <Marker
          key={place.place_id}
          coordinate={{
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          }}
          onPress={() => setSelectedPlace(place)}
        >
          <Callout tooltip>
            <View style={styles.callout}>
              <View style={styles.calloutText}>
                <Text style={styles.calloutTitle}>{place.name}</Text>
                <Text>{place.vicinity}</Text>
                {place.rating && (
                  <Text>Rating: {place.rating} ⭐</Text>
                )}
              </View>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
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
  },
  calloutText: {
    flex: 1,
  }
});

export default NativeMap;

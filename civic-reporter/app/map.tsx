import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import { useAppStore } from '@/lib/store';
import { runSyncOnce } from '@/lib/sync';

export default function MapScreen() {
  const reports = useAppStore(s => s.reports);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      try {
        // Load reports from server first
        setLoading(true);
        await runSyncOnce();
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setUserLoc(null);
          setLoading(false);
          return;
        }
        
        // Get current location
        const loc = await Location.getCurrentPositionAsync({ 
          accuracy: Location.Accuracy.Balanced
        });
        setUserLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLocationError(null);
        
        // Watch location for updates
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLoc) => {
            setUserLoc({ lat: newLoc.coords.latitude, lng: newLoc.coords.longitude });
            // Update map with new location
            updateMapLocation(newLoc.coords.latitude, newLoc.coords.longitude);
          }
        );
        
        // Cleanup subscription after 30 seconds to save battery
        setTimeout(() => subscription.remove(), 30000);
        
      } catch (error) {
        setLocationError('Failed to get location');
        console.error('Location error:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateMapLocation = (lat: number, lng: number) => {
    if (webViewRef.current) {
      const script = `
        if (window.map && window.userMarker) {
          window.userMarker.setLatLng([${lat}, ${lng}]);
          window.map.setView([${lat}, ${lng}], window.map.getZoom());
        }
      `;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const markers = reports
    .filter(r => r.location)
    .map(r => ({ id: r.id, lat: r.location!.lat, lng: r.location!.lng, title: r.description || 'Report' }));

  const center = userLoc || { lat: 28.6139, lng: 77.2090 };

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style> 
          html, body, #map { height:100%; margin:0; } 
          .loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1000; background: white; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div id="loading" class="loading">Loading map...</div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
          const center = [${center.lat}, ${center.lng}];
          const map = L.map('map').setView(center, 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map);
          
          const markers = ${JSON.stringify(markers)};
          markers.forEach(m => {
            const marker = L.marker([m.lat, m.lng]).addTo(map);
            marker.bindPopup(\`<b>Report #\${m.id}</b><br>\${m.title}\`);
          });
          
          // User location marker
          ${userLoc ? `
            window.userMarker = L.circleMarker([${userLoc.lat}, ${userLoc.lng}], { 
              radius: 12, 
              color: '#2563EB', 
              fillColor: '#60A5FA', 
              fillOpacity: 0.8,
              weight: 3
            }).addTo(map);
            window.userMarker.bindPopup('📍 You are here');
            
            // Add pulsing effect
            const pulse = L.circleMarker([${userLoc.lat}, ${userLoc.lng}], {
              radius: 20,
              color: '#2563EB',
              fillColor: '#60A5FA',
              fillOpacity: 0.2,
              weight: 2
            }).addTo(map);
            
            // Center map on user location
            map.setView([${userLoc.lat}, ${userLoc.lng}], 15);
          ` : ''}
          
          // Hide loading
          document.getElementById('loading').style.display = 'none';
        </script>
      </body>
    </html>`;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Map' }} />
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Map' }} />
      {locationError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      )}
      <WebView 
        ref={webViewRef}
        originWhitelist={["*"]} 
        source={{ html }} 
        style={{ flex: 1 }}
        onLoadEnd={() => {
          // Map is ready
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    zIndex: 1000,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
});



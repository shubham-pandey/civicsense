import { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Image, Text, Pressable, ScrollView } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { useRef } from 'react';
import { Stack } from 'expo-router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { createServerReport, getApiBase } from '@/lib/api';
import { runSyncOnce } from '@/lib/sync';
import { classifyImage, isAiEnabled } from '@/lib/ai';
import { log } from '@/lib/log';
// import { createReportInFirestore } from '@/lib/firebase';

const CATEGORIES = [
  { value: 'pothole', label: 'Pothole' },
  { value: 'lighting', label: 'Streetlight' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'other', label: 'Other' },
];

export default function ReportScreen() {
  const [image, setImage] = useState<string | undefined>();
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>();
  const previewRef = useRef<View>(null);
  const [imageRatio, setImageRatio] = useState<number | undefined>();
  const [hint, setHint] = useState<string | null>(null);
  const [classifying, setClassifying] = useState(false);
  const [classifyError, setClassifyError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const aiOn = isAiEnabled();

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    log('Camera result', { canceled: result.canceled });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      Image.getSize(uri, (w, h) => setImageRatio(w / h), () => setImageRatio(undefined));
      setHint(null);
      setClassifyError(null);
      if (aiOn) {
        log('Image classification started');
        setClassifying(true);
        classifyImage(uri)
          .then(pred => {
            if (pred && (pred as any)[0]) {
              const p = (pred as any)[0];
              setHint(`SEEMS LIKE ${p.label} (${Math.round(p.score * 100)}%)`);
              log('Image classification result', p);
            } else {
              setClassifyError('Could not classify image.');
            }
          })
          .catch(() => {
            setClassifyError('Could not classify image.');
          })
          .finally(() => setClassifying(false));
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchLocation = async () => {
      try {
        // 1) Use last known position for instant feedback
        const last = await Location.getLastKnownPositionAsync();
        if (last && mounted) {
          setCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
          log('Location (last known)', { lat: last.coords.latitude, lng: last.coords.longitude });
        }

        // 2) Start a short-lived watch to get a fresh fix quickly, then stop
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 1000,
            distanceInterval: 0,
          },
          loc => {
            if (!mounted) return;
            setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            log('Location (fresh fix)', { lat: loc.coords.latitude, lng: loc.coords.longitude });
            // Remove after first fix
            subscription.remove();
          }
        );
      } catch (e) {
        // Permission gating handled at app startup
      }
    };
    fetchLocation();
    return () => {
      mounted = false;
    };
  }, []);

  const submit = async () => {
    if (!coords) { log('Submit blocked: no location'); return; }
    if (!description.trim()) { log('Submit blocked: no description'); return; }
    if (!reporterName.trim()) { log('Submit blocked: no name'); return; }
    if (!reporterPhone.trim()) { log('Submit blocked: no phone'); return; }
    
    setSubmitting(true);
    
    try {
      let stampedUri = image;
      if (previewRef.current && image) {
        try {
          stampedUri = await captureRef(previewRef, { format: 'jpg', quality: 0.9 });
        } catch (e) {}
      }
      
      let imageDataUrl: string | undefined = undefined;
      if (stampedUri && (stampedUri.startsWith('file://') || stampedUri.startsWith('content://'))) {
        try {
          const base64 = await FileSystem.readAsStringAsync(stampedUri, { encoding: FileSystem.EncodingType.Base64 });
          imageDataUrl = `data:image/jpeg;base64,${base64}`;
        } catch {}
      } else {
        imageDataUrl = stampedUri;
      }
      
      const body = {
        description: description.trim(),
        imageUri: imageDataUrl,
        location: { 
          lat: Number(coords.lat), 
          lng: Number(coords.lng),
          address: undefined 
        },
        category,
        priority: undefined,
        reporter: {
          name: reporterName.trim(),
          email: reporterEmail.trim() || undefined,
          phone: reporterPhone.trim(),
        },
      };
      
      // Upload directly to server
      await createServerReport(body as any);
      log('Report uploaded to admin backend');
      
      // Refresh data from server
      await runSyncOnce();
      
  // Clear form
  setImage(undefined);
  setDescription('');
  setCategory('other');
  setReporterName('');
  setReporterEmail('');
  setReporterPhone('');
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 3000);
  log('Report submitted and data refreshed');
    } catch (e) {
      log('Report upload failed:', e);
      // Show error to user
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Report' }} />
      {showSuccess && (
        <View style={{ backgroundColor: '#D1FAE5', padding: 12, borderRadius: 8, margin: 12 }}>
          <Text style={{ color: '#065F46', fontWeight: 'bold', textAlign: 'center' }}>Report submitted successfully!</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Report an Issue</Text>
        {!aiOn && (
          <View style={{ backgroundColor: '#FEF3C7', borderColor: '#F59E0B', borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 8 }}>
            <Text style={{ color: '#92400E' }}>Image suggestions are disabled. Set EXPO_PUBLIC_HF_TOKEN in .env to enable.</Text>
          </View>
        )}
        <Card>
        {image && (
          <ViewShot ref={previewRef} style={[styles.previewWrap, imageRatio ? { aspectRatio: imageRatio } : { height: 220 }]} options={{ format: 'jpg', quality: 0.9 }}>
            <Image source={{ uri: image }} style={styles.preview} resizeMode="contain" />
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>
                {coords ? `Lat: ${coords.lat.toFixed(5)}  Lng: ${coords.lng.toFixed(5)}` : 'Location: N/A'}
              </Text>
              <Text style={styles.overlayText}>{new Date().toLocaleString()}</Text>
              {classifying && <Text style={[styles.overlayText, { marginTop: 4 }]}>Analyzing image…</Text>}
              {hint && !classifying && <Text style={[styles.overlayText, { marginTop: 4 }]}>{hint}</Text>}
            </View>
          </ViewShot>
        )}
        {classifyError && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: '#B91C1C' }}>{classifyError}</Text>
          </View>
        )}
        <View style={{ height: 12 }} />
        <Button title="Take Photo" onPress={takePhoto} full />
        <View style={{ height: 12 }} />
        <View style={{ marginTop: 8 }}>
          {coords ? (
            <>
              <Text style={[styles.coords, { color: '#065F46' }]}>Latitude: {coords.lat.toFixed(6)}</Text>
              <Text style={[styles.coords, { color: '#065F46' }]}>Longitude: {coords.lng.toFixed(6)}</Text>
            </>
          ) : (
            <Text style={{ color: '#B91C1C' }}>Location not added</Text>
          )}
        </View>
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryContainer}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              style={[styles.categoryButton, category === cat.value && styles.categoryButtonSelected]}
              onPress={() => setCategory(cat.value)}
            >
              <Text style={[styles.categoryText, category === cat.value && styles.categoryTextSelected]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Description *</Text>
        <TextInput
          placeholder="Describe the issue in detail"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          multiline
        />
        <View style={{ height: 12 }} />
        <Text style={styles.label}>Your Information</Text>
        <TextInput
          placeholder="Your name *"
          value={reporterName}
          onChangeText={setReporterName}
          style={styles.input}
        />
        <View style={{ height: 8 }} />
        <TextInput
          placeholder="Mobile number *"
          value={reporterPhone}
          onChangeText={setReporterPhone}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <View style={{ height: 8 }} />
        <TextInput
          placeholder="Email address (optional)"
          value={reporterEmail}
          onChangeText={setReporterEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={{ height: 12 }} />
        <Button 
          title={submitting ? "Submitting..." : "Submit Report"} 
          onPress={submit} 
          full 
          disabled={!coords || !description.trim() || !reporterName.trim() || !reporterPhone.trim() || submitting} 
        />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  preview: { width: '100%', height: 220, borderRadius: 8 },
  previewWrap: { width: '100%', height: 220, borderRadius: 8, overflow: 'hidden' },
  label: { fontSize: 16, fontWeight: '600', color: '#0F172A', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontSize: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  categoryButtonSelected: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  coords: { color: '#0F172A' },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  overlayText: { color: '#fff', fontSize: 12 },
});



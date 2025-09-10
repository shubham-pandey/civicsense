import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ServerOnlyReport } from '@/lib/store';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as any);
  return getFirestore(app);
}

function getStorageBucket() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig as any);
  return getStorage(app);
}

function computeRouting(input: { description?: string; category?: string }) {
  const text = `${input.category || ''} ${input.description || ''}`.toLowerCase();
  let department = 'General';
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (text.includes('pothole') || text.includes('road')) department = 'Roads';
  if (text.includes('garbage') || text.includes('trash')) department = 'Sanitation';
  if (text.includes('light') || text.includes('streetlight')) department = 'Lighting';
  if (text.includes('water') || text.includes('leak')) department = 'Water';
  if (text.includes('urgent') || text.includes('accident') || text.includes('hazard')) priority = 'high';
  if (text.includes('minor')) priority = 'low';
  return { department, priority };
}

export async function createReportInFirestore(report: Omit<ServerOnlyReport, 'id' | 'createdAt' | 'status'>) {
  const db = getDb();
  const routing = computeRouting({ description: report.description, category: report.category });
  const ref = await addDoc(collection(db, 'reports'), {
    description: report.description ?? null,
    imageUrl: report.imageUri ?? null,
    location: report.location ?? null,
    status: 'submitted',
    createdAt: serverTimestamp(),
    category: report.category || null,
    priority: report.priority || routing.priority,
    department: (report as any).department || routing.department,
    timeline: [
      { status: 'submitted', at: serverTimestamp(), note: 'Report submitted' },
    ],
  });
  return ref.id;
}

export async function uploadReportImageAndCreateReport(
  uri: string | undefined,
  data: Omit<ServerOnlyReport, 'id' | 'createdAt' | 'status' | 'imageUri'>
) {
  let imageUrl: string | undefined = undefined;
  if (uri) {
    const storage = getStorageBucket();
    const key = `reports/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const storageRef = ref(storage, key);
    const blob = await fetch(uri).then(r => r.blob());
    await uploadBytes(storageRef, blob as any, { contentType: 'image/jpeg' });
    imageUrl = await getDownloadURL(storageRef);
  }
  const id = await createReportInFirestore({ ...data, imageUri: imageUrl });
  return id;
}

export async function updateReportStatus(id: string, status: ServerOnlyReport['status']) {
  const db = getDb();
  const ref = doc(db, 'reports', id);
  await setDoc(ref, {
    status,
  }, { merge: true });
}

export async function listReports() {
  const db = getDb();
  const snapshot = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
  return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}



// Simple image classifier using Hugging Face Inference API
// Set EXPO_PUBLIC_HF_TOKEN in your env to enable

import * as FileSystem from 'expo-file-system';
import { warn } from '@/lib/log';

export type Prediction = { label: string; score: number }[];

export function isAiEnabled(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_HF_TOKEN);
}

export async function classifyImage(uri: string): Promise<Prediction | null> {
  try {
    const token = process.env.EXPO_PUBLIC_HF_TOKEN;
    if (!token) return null;
    const model = process.env.EXPO_PUBLIC_HF_MODEL || 'google/vit-base-patch16-224';
    const url = `https://api-inference.huggingface.co/models/${model}`;

    // Use FileSystem.uploadAsync for local URIs to ensure binary upload
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      const upload = await FileSystem.uploadAsync(url, uri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      if (upload.status !== 200) {
        try { warn('HF upload failed', { status: upload.status, body: upload.body?.slice(0, 200) }); } catch {}
        return null;
      }
      const parsed = JSON.parse(upload.body) as Prediction;
      return parsed;
    }

    // Fallback for remote URIs
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: await fetch(uri).then(r => r.arrayBuffer()),
    });
    if (!res.ok) {
      try { warn('HF fetch failed', { status: res.status, body: (await res.text()).slice(0, 200) }); } catch {}
      return null;
    }
    const data = (await res.json()) as Prediction;
    return data;
  } catch (e) {
    return null;
  }
}



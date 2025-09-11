export type ServerReport = {
  id: string | number;
  description: string | null;
  imageUrl?: string | null;
  location?: { lat?: number | null; lng?: number | null; address?: string | null } | null;
  lat?: number | null; // legacy
  lng?: number | null; // legacy
  status: string;
  category: string | null;
  priority: string | null;
  department: string | null;
  createdAt: number | string;
};

export function getApiBase(): string {
  // Point to civicsenseadmin backend by default
  return process.env.EXPO_PUBLIC_ADMIN_API_BASE || 'http://127.0.0.1:3000';
}

function normalizeStatus(status: string): string {
  if (status === 'new') return 'submitted';
  return status;
}

export async function listServerReports(): Promise<ServerReport[]> {
  const base = getApiBase();
  console.log('Fetching reports from:', `${base}/api/reports`);
  const res = await fetch(`${base}/api/reports`);
  if (!res.ok) throw new Error('list_failed');
  const json = (await res.json()) as { data: any[] };
  console.log('Raw API response:', json);
  const data = (json.data || []).map((r: any) => ({
    id: r.id,
    description: r.description ?? null,
    imageUrl: (r.attachments && r.attachments[0]) ? `${base}${r.attachments[0]}` : null,
    location: r.location || null,
    status: normalizeStatus(r.status),
    category: r.category ?? null,
    priority: r.priority ?? null,
    department: r.department ?? null,
    createdAt: r.createdAt,
  })) as ServerReport[];
  console.log('Processed reports:', data);
  return data;
}

export async function getServerReport(id: string): Promise<any> {
  const base = getApiBase();
  
  // Validate ID
  if (!id || id === 'null' || id === 'undefined') {
    throw new Error('Invalid report ID');
  }
  
  const res = await fetch(`${base}/api/reports/${id}`);
  if (!res.ok) throw new Error(`get_failed: ${res.status} ${res.statusText}`);
  const r = await res.json();
  r.status = normalizeStatus(r.status);
  return r;
}

export type CreateReportBody = {
  description: string;
  imageUri?: string; // data URL or remote URL
  location: { lat: number; lng: number; address?: string };
  reporter?: { name?: string; email?: string; phone?: string };
  category?: string;
  priority?: string;
  department?: string;
};

export async function createServerReport(body: CreateReportBody): Promise<{ id: string | number }> {
  const base = getApiBase();
  console.log('Sending report body:', JSON.stringify(body, null, 2));
  const res = await fetch(`${base}/api/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Create report failed:', res.status, errorText);
    throw new Error(`create_failed: ${res.status} ${errorText}`);
  }
  return (await res.json()) as any;
}

export async function updateServerReport(id: string | number, body: { status?: string; priority?: string; department?: string; note?: string }): Promise<{ ok: boolean }> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/reports/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error('update_failed');
  return (await res.json()) as any;
}



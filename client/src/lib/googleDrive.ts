// Google Drive integration service
// Uses Google Identity Services for OAuth + Drive API v3 for file operations

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_NAME = "Akmal Creative Hub Assets";
const TOKEN_KEY = "akmal-google-token";
const FOLDER_ID_KEY = "akmal-drive-folder-id";

interface GoogleToken {
  access_token: string;
  expires_at: number;
}

let gapiLoaded = false;

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) return resolve();
    if (document.querySelector('script[src*="accounts.google.com"]')) {
      // Already loading, wait
      const check = setInterval(() => {
        if ((window as any).google?.accounts) {
          gapiLoaded = true;
          clearInterval(check);
          resolve();
        }
      }, 200);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapiLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function getClientId(): string {
  // Check env variable first, then localStorage override
  const envId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  const localId = localStorage.getItem("akmal-google-client-id");
  return localId || envId || "";
}

export function setGoogleClientId(clientId: string) {
  localStorage.setItem("akmal-google-client-id", clientId);
}

export function getGoogleClientId(): string {
  return getClientId();
}

function getStoredToken(): GoogleToken | null {
  try {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (!saved) return null;
    const token = JSON.parse(saved) as GoogleToken;
    if (token.expires_at < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

function setStoredToken(token: GoogleToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export function clearGoogleToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(FOLDER_ID_KEY);
}

export function isGoogleConnected(): boolean {
  return !!getStoredToken();
}

export async function connectGoogleDrive(): Promise<{ success: boolean; error?: string }> {
  const clientId = getClientId();
  if (!clientId) {
    return { success: false, error: "Google Client ID not configured. Go to Settings and add your Client ID." };
  }

  await loadGoogleScript();

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    return { success: false, error: "Google Identity Services not loaded" };
  }

  return new Promise((resolve) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.file",
        callback: (response: any) => {
          if (response.error) {
            resolve({ success: false, error: response.error_description || "Authorization failed" });
            return;
          }
          const token: GoogleToken = {
            access_token: response.access_token,
            expires_at: Date.now() + 55 * 60 * 1000, // 55 min
          };
          setStoredToken(token);
          resolve({ success: true });
        },
      });
      tokenClient.requestAccessToken();
    } catch (err: any) {
      resolve({ success: false, error: err.message || "Failed to connect" });
    }
  });
}

async function getToken(): Promise<string | null> {
  const stored = getStoredToken();
  return stored?.access_token || null;
}

async function getOrCreateFolder(): Promise<string | null> {
  const existing = localStorage.getItem(FOLDER_ID_KEY);
  if (existing) return existing;

  const token = await getToken();
  if (!token) return null;

  // Search for existing folder
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=name='${encodeURIComponent(FOLDER_NAME)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) {
    localStorage.setItem(FOLDER_ID_KEY, searchData.files[0].id);
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const folder = await createRes.json();
  if (folder.id) {
    localStorage.setItem(FOLDER_ID_KEY, folder.id);
    return folder.id;
  }
  return null;
}

export async function uploadToDrive(file: File): Promise<{ success: boolean; fileId?: string; error?: string }> {
  const token = await getToken();
  if (!token) {
    return { success: false, error: "Not connected to Google Drive. Click the Connect button first." };
  }

  const folderId = await getOrCreateFolder();
  if (!folderId) {
    return { success: false, error: "Could not create/find Drive folder" };
  }

  try {
    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const res = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error?.message || "Upload failed" };
    }

    const data = await res.json();
    return { success: true, fileId: data.id };
  } catch (err: any) {
    return { success: false, error: err.message || "Upload failed" };
  }
}

export async function listDriveFiles(): Promise<{ id: string; name: string; webViewLink: string; size: string; createdTime: string }[]> {
  const token = await getToken();
  if (!token) return [];

  const folderId = await getOrCreateFolder();
  if (!folderId) return [];

  try {
    const res = await fetch(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,webViewLink,size,createdTime)&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      webViewLink: f.webViewLink,
      size: f.size ? `${(Number(f.size) / 1024).toFixed(0)} KB` : "N/A",
      createdTime: f.createdTime,
    }));
  } catch {
    return [];
  }
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  const token = await getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

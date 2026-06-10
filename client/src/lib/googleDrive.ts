// Google Drive integration - Full OAuth (uploads + listing)
const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_NAME = "Akmal Creative Hub Assets";
const TOKEN_KEY = "akmal-google-token";
const FOLDER_ID_KEY = "akmal-drive-folder-id";
const CLIENT_ID = "941511489023-tnicalb26gt9i4gtq1a60vfe6asskc63.apps.googleusercontent.com";

interface GoogleToken {
  access_token: string;
  expires_at: number;
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
  } catch { return null; }
}

function setStoredToken(token: GoogleToken) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

export function isDriveConfigured(): boolean {
  return !!getStoredToken();
}

export function clearDriveConfig() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(FOLDER_ID_KEY);
}

export async function connectGoogleDrive(): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const tokenClient = (window as any).google?.accounts?.oauth2?.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (response: any) => {
        if (response.error) {
          resolve({ success: false, error: response.error_description || "Authorization failed" });
          return;
        }
        const token: GoogleToken = {
          access_token: response.access_token,
          expires_at: Date.now() + 55 * 60 * 1000,
        };
        setStoredToken(token);
        resolve({ success: true });
      },
    });
    if (!tokenClient) {
      resolve({ success: false, error: "Google Identity Services not loaded. Reload the page." });
      return;
    }
    tokenClient.requestAccessToken();
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
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=name='${encodeURIComponent(FOLDER_NAME)}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) {
    localStorage.setItem(FOLDER_ID_KEY, searchData.files[0].id);
    return searchData.files[0].id;
  }
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  const folder = await createRes.json();
  if (folder.id) {
    localStorage.setItem(FOLDER_ID_KEY, folder.id);
    return folder.id;
  }
  return null;
}

export async function createProjectFolder(projectName: string): Promise<string | null> {
  const token = await getToken();
  if (!token) return null;
  const parentId = await getOrCreateFolder();
  if (!parentId) return null;
  const searchRes = await fetch(
    `${DRIVE_API_BASE}/files?q=name='${encodeURIComponent(projectName)}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return `https://drive.google.com/drive/folders/${searchData.files[0].id}`;
  const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: projectName, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  const folder = await createRes.json();
  if (folder.id) {
    return `https://drive.google.com/drive/folders/${folder.id}`;
  }
  return null;
}

export async function uploadToDrive(file: File, projectName?: string): Promise<{ success: boolean; fileId?: string; error?: string }> {
  const token = await getToken();
  if (!token) return { success: false, error: "Not connected to Google Drive" };
  let parentId = await getOrCreateFolder();
  if (projectName) {
    const projectFolderLink = await createProjectFolder(projectName);
    if (projectFolderLink) {
      const match = projectFolderLink.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (match) parentId = match[1];
    }
  }
  if (!parentId) return { success: false, error: "Could not find/create Drive folder" };
  try {
    const metadata = { name: file.name, parents: [parentId] };
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
    return { success: true, fileId: (await res.json()).id };
  } catch (err: any) {
    return { success: false, error: err.message || "Upload failed" };
  }
}

export async function listDriveFiles(projectName?: string): Promise<{ id: string; name: string; webViewLink: string; size: string }[]> {
  const token = await getToken();
  if (!token) return [];
  let folderId = await getOrCreateFolder();
  if (projectName) {
    const searchRes = await fetch(
      `${DRIVE_API_BASE}/files?q=name='${encodeURIComponent(projectName)}' and '${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await searchRes.json();
    if (data.files?.length > 0) folderId = data.files[0].id;
  }
  if (!folderId) return [];
  try {
    const res = await fetch(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,webViewLink,size)&orderBy=createdTime desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id, name: f.name, webViewLink: f.webViewLink,
      size: f.size ? `${(Number(f.size) / 1024).toFixed(0)} KB` : "N/A",
    }));
  } catch { return []; }
}

export function getDriveUploadLink(): string {
  const folderId = localStorage.getItem(FOLDER_ID_KEY);
  return folderId ? `https://drive.google.com/drive/folders/${folderId}` : "";
}

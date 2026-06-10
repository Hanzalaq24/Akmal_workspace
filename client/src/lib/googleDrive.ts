// Google Drive integration - Simple API Key + Folder approach (no OAuth needed)
// Files are listed via Drive API v3 with API Key
// Uploads go through a shared Drive folder link

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const API_KEY_KEY = "akmal-drive-api-key";
const FOLDER_ID_KEY = "akmal-drive-folder-id";
const FOLDER_LINK_KEY = "akmal-drive-folder-link";

export function setDriveApiKey(key: string) {
  localStorage.setItem(API_KEY_KEY, key.trim());
}

export function getDriveApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) || "";
}

export function setDriveFolderId(id: string) {
  localStorage.setItem(FOLDER_ID_KEY, id.trim());
}

export function getDriveFolderId(): string {
  return localStorage.getItem(FOLDER_ID_KEY) || "";
}

export function setDriveFolderLink(link: string) {
  localStorage.setItem(FOLDER_LINK_KEY, link.trim());
}

export function getDriveFolderLink(): string {
  return localStorage.getItem(FOLDER_LINK_KEY) || "";
}

export function isDriveConfigured(): boolean {
  return !!getDriveApiKey() && !!getDriveFolderId();
}

export function clearDriveConfig() {
  localStorage.removeItem(API_KEY_KEY);
  localStorage.removeItem(FOLDER_ID_KEY);
  localStorage.removeItem(FOLDER_LINK_KEY);
}

// Extract folder ID from a Google Drive folder URL
export function extractFolderId(url: string): string {
  // Handle: https://drive.google.com/drive/folders/XXXXX
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // Handle: https://drive.google.com/drive/u/0/folders/XXXXX
  const match2 = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];
  // If it's just an ID
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url.trim())) return url.trim();
  return "";
}

export async function listDriveFiles(): Promise<{ id: string; name: string; webViewLink: string; size: string; createdTime: string }[]> {
  const apiKey = getDriveApiKey();
  const folderId = getDriveFolderId();
  if (!apiKey || !folderId) return [];

  try {
    const res = await fetch(
      `${DRIVE_API_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,webViewLink,size,createdTime)&orderBy=createdTime desc&key=${apiKey}`
    );
    if (!res.ok) return [];
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

export function getDriveUploadLink(): string {
  const link = getDriveFolderLink();
  if (link) return link;
  const folderId = getDriveFolderId();
  if (folderId) return `https://drive.google.com/drive/folders/${folderId}`;
  return "";
}

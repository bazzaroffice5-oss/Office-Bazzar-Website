/**
 * Zoho CRM Account Attachments Service
 *
 * Provides persistent, cross-container image storage for uploaded product assets
 * directly attached to the Office Bazzar Account (1476900000000575002) in Zoho CRM v6.
 * All uploads execute strictly server-side and survive Vercel lambda cold starts.
 */

import { getZohoAccessToken, getZohoApiDomain, isZohoConfigured } from './client';
import { ZOHO_ACCOUNT_PARENT_ID } from './products';

export async function uploadZohoAttachment(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string | null> {
  if (!(await isZohoConfigured())) return null;

  try {
    const token = await getZohoAccessToken();
    const apiDomain = getZohoApiDomain();
    const endpoint = `${apiDomain}/crm/v6/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Attachments`;

    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    const formData = new FormData();
    formData.append('file', blob, filename);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[ZohoAttachment] Upload failed status:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const item = data?.data?.[0];
    if (item && (item.code === 'SUCCESS' || item.status === 'success') && item.details?.id) {
      return String(item.details.id);
    }
  } catch (err) {
    console.warn('[ZohoAttachment] Upload error:', err);
  }
  return null;
}

export async function downloadZohoAttachment(
  attachmentId: string
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!attachmentId || !(await isZohoConfigured())) return null;

  try {
    const token = await getZohoAccessToken();
    const apiDomain = getZohoApiDomain();
    const endpoint = `${apiDomain}/crm/v6/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Attachments/${attachmentId}`;

    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    const ab = await res.arrayBuffer();
    return {
      buffer: Buffer.from(ab),
      mimeType,
    };
  } catch (err) {
    console.warn('[ZohoAttachment] Download error:', err);
    return null;
  }
}

export async function deleteZohoAttachment(
  attachmentId: string
): Promise<boolean> {
  if (!attachmentId || !(await isZohoConfigured())) return false;

  try {
    const token = await getZohoAccessToken();
    const apiDomain = getZohoApiDomain();
    const endpoint = `${apiDomain}/crm/v6/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Attachments/${attachmentId}`;

    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });

    if (res.ok) {
      return true;
    }

    const altEndpoint = `${apiDomain}/crm/v6/Accounts/${ZOHO_ACCOUNT_PARENT_ID}/Attachments?ids=${attachmentId}`;
    const altRes = await fetch(altEndpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });
    return altRes.ok;
  } catch (err) {
    console.warn('[ZohoAttachment] Delete error:', err);
    return false;
  }
}

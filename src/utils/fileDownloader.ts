/**
 * Helper to reliably download files (ZIP, PDF, CSV, etc.) even within sandboxed iframes
 * by fetching the resource into an in-memory Blob and triggering a client-side download.
 */
export async function downloadFileAsBlob(
  url: string,
  filename: string,
  onProgress?: (status: 'downloading' | 'ready' | 'error', message?: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('downloading', 'Packaging project archive...');

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/zip, application/octet-stream, */*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to download file.`);
    }

    const contentType = response.headers.get('content-type') || '';
    const blob = await response.blob();

    // Check if the response was an auth redirect HTML page instead of the real zip
    if (contentType.includes('text/html') || blob.size < 2000) {
      // Check if it's an HTML page
      const text = await blob.text();
      if (text.includes('<html') || text.includes('cookie_check')) {
        throw new Error('Authentication cookie required. Please open the app in a new tab to download.');
      }
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }, 10000);

    if (onProgress) onProgress('ready', 'Download started successfully!');
    return true;
  } catch (error: any) {
    console.error('Blob download failed, falling back:', error);
    if (onProgress) onProgress('error', error?.message || 'Download failed');

    // Fallback: try direct window open
    try {
      window.open(url, '_blank');
    } catch {
      // ignore
    }
    return false;
  }
}

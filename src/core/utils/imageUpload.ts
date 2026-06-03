/**
 * Image Upload Utility
 * Uploads local image buffer to a free public image host (Catbox.moe)
 * to obtain a public HTTPS URL.
 */

export async function uploadToPublicHost(buffer: Buffer, filename: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

  try {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }), filename);

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    if (res.ok) {
      return await res.text(); // Returns the public URL like https://files.catbox.moe/...
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Image upload timed out after 8 seconds');
    } else {
      console.error('Image upload failed:', error);
    }
  } finally {
    clearTimeout(timeoutId);
  }
  return undefined;
}

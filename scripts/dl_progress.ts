import { mkdir } from 'fs/promises';
import { createGunzip } from 'zlib';
import { extract } from 'tar';

export async function download_asset(url: string, dest: string) {
  await mkdir(dest, { recursive: true });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  
  const totalSize = Number(response.headers.get('content-length')) || 0;
  let downloadedSize = 0;

  const gunzip = createGunzip();
  const ext = extract({ cwd: dest });

  const body = response.body;
  if (!body) throw new Error('No response body');

  let lastLogTime = 0;

  await new Promise((resolve, reject) => {
    const reader = body.getReader();
    const pump = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          downloadedSize += value.length;
          gunzip.write(value);
          
          // Update progress
          const now = Date.now();
          if (totalSize > 0 && now - lastLogTime > 100) { // Update every 100ms
            const percentComplete = Math.round((downloadedSize / totalSize) * 100);
            process.stdout.write(`\rDownloading... ${percentComplete}% complete`);
            lastLogTime = now;
          }
        }
        gunzip.end();
      } catch (error) {
        reject(error);
      }
    };

    pump();
    gunzip.pipe(ext);
    ext.on('finish', resolve);
    ext.on('error', reject);
  });

  // Clear the progress message and move to a new line
  process.stdout.write('\r\x1b[K');
  console.log('Download and extraction complete!');
}
import type { GameState } from '@/game/types';

/**
 * Minimal ZIP (store / no compression) writer for CBZ archives.
 * CBZ = ZIP of sequentially named page images; most readers accept STORE method.
 */
function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n, true);
  return b;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function buildZip(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const localHeader = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
    ]);
    localParts.push(localHeader, file.data);

    const central = concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(file.data.length),
      u32(file.data.length),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ]);
    centralParts.push(central);
    offset += localHeader.length + file.data.length;
  }

  const centralDir = concat(centralParts);
  const localBlob = concat(localParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(localBlob.length),
    u16(0),
  ]);

  return new Blob([concat([localBlob, centralDir, end])], { type: 'application/vnd.comicbook+zip' });
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function collectPanelUrls(state: GameState): string[] {
  const urls: string[] = [];
  for (const entry of state.log) {
    if (entry.panels?.length) {
      for (const panel of entry.panels) {
        if (panel.imageUrl) urls.push(panel.imageUrl);
      }
    } else if (entry.imageUrls?.length) {
      urls.push(...entry.imageUrls.filter(Boolean));
    }
  }
  return urls;
}

export async function exportSessionToCbz(state: GameState): Promise<Blob> {
  const urls = collectPanelUrls(state);
  if (urls.length === 0) {
    throw new Error('No panel images found to pack into a CBZ.');
  }

  const files: Array<{ name: string; data: Uint8Array }> = [];
  let page = 1;
  for (const url of urls) {
    const data = await fetchImageBytes(url);
    if (!data) continue;
    const ext = url.includes('png') || url.startsWith('data:image/png') ? 'png' : 'jpg';
    files.push({ name: `${String(page).padStart(3, '0')}.${ext}`, data });
    page += 1;
  }

  if (files.length === 0) {
    throw new Error('Could not download any panel images for CBZ export.');
  }

  return buildZip(files);
}

export function downloadCbz(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.cbz') ? filename : `${filename}.cbz`;
  a.click();
  URL.revokeObjectURL(url);
}

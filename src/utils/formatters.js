export const formatDuration = (val) => {
  if (val === null || val === undefined) return '00:00:00';

  // Clean string or process value

  // Handle "1h 2m 3s" format
  if (typeof val === 'string' && (val.includes('h') || val.includes('m') || val.includes('s'))) {
    const hMatch = val.match(/(\d+)\s*h/);
    const mMatch = val.match(/(\d+)\s*m/);
    const sMatch = val.match(/(\d+)\s*s/);
    const h = hMatch ? parseInt(hMatch[1]) : 0;
    const m = mMatch ? parseInt(mMatch[1]) : 0;
    const s = sMatch ? parseInt(sMatch[1]) : 0;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  const num = Number(val);
  if (!isNaN(num)) {
    const h = Math.floor(num / 3600);
    const m = Math.floor((num % 3600) / 60);
    const s = Math.floor(num % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return val;
};

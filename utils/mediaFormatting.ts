export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
}

export function formatSeasonsLabel(seasons: number): string {
  return `${seasons} Season${seasons !== 1 ? 's' : ''}`;
}

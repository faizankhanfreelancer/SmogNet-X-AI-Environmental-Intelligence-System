export function getAqiColor(aqi: number) {
  if (aqi <= 50) return "#22c55e"; // green
  if (aqi <= 100) return "#eab308"; // yellow
  if (aqi <= 150) return "#f97316"; // orange
  if (aqi <= 200) return "#ef4444"; // red
  if (aqi <= 300) return "#a855f7"; // purple
  return "#9f1239"; // maroon
}

export function getAqiLabel(aqi: number) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getSeverityBadgeColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'low': return "bg-green-500/20 text-green-500 border-green-500/50";
    case 'medium': return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50";
    case 'high': return "bg-orange-500/20 text-orange-500 border-orange-500/50";
    case 'critical': return "bg-red-500/20 text-red-500 border-red-500/50";
    default: return "bg-gray-500/20 text-gray-500 border-gray-500/50";
  }
}

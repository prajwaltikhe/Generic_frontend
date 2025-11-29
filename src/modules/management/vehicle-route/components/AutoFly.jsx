import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

const AutoFlyTo = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (!isNaN(lat) && !isNaN(lng)) map.flyTo([parseFloat(lat), parseFloat(lng)], 13);
  }, [lat, lng, map]);

  return null;
};
export default AutoFlyTo;

// | Zoom Level | Description                 |
// | ---------- | --------------------------- |
// | `5–8`      | Country/region level        |
// | `10–12`    | City/town level             |
// | `13–14`    | Neighborhood/street level   |
// | `15–16`    | Building level (very close) |

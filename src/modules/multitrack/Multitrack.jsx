import { useState, useCallback } from 'react';
import { useFetchVehicles } from '../../hooks/useFetchVehicles';
import TrackingPanel from './components/TrackingPanel';
import MapComponent from './components/MapComponent';
import MheStatusPanel from './components/MheStatusPanel';

export default function Multitrack() {
  useFetchVehicles();
  const [showPanel, setShowPanel] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const handleRightPanel = useCallback(
    (vehicle) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!vehicle) {
        setShowPanel(false);
        setSelectedVehicle(null);
      } else if (selectedVehicle?.id === vehicle.id) {
        setShowPanel(false);
        setTimeout(() => setSelectedVehicle(null), 300);
      } else {
        setSelectedVehicle(vehicle);
        setShowPanel(true);
      }
    },
    [selectedVehicle]
  );

  return (
    <div className='relative flex-1 h-screen rounded-md'>
      <TrackingPanel handleRightPanel={handleRightPanel} />
      <MapComponent selectedVehicle={selectedVehicle} />
      <MheStatusPanel handleRightPanel={() => handleRightPanel()} isShowPanel={showPanel} vehicle={selectedVehicle} />
    </div>
  );
}

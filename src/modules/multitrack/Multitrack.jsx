import { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useFetchVehicles } from '../../hooks/useFetchVehicles';
import TrackingPanel from './components/TrackingPanel';
import MapComponent from './components/MapComponent';
import MheStatusPanel from './components/MheStatusPanel';

export default function Multitrack() {
  useFetchVehicles(30000);
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => localStorage.getItem('selectedVehicleId'));
  const [showPanel, setShowPanel] = useState(() => !!selectedVehicleId);
  const devices = useSelector((s) => s.multiTrackStatus.devices);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return devices.find((d) => d.id === selectedVehicleId) || null;
  }, [devices, selectedVehicleId]);

  const handleRightPanel = useCallback(
    (vehicle) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (!vehicle) {
        setShowPanel(false);
        setSelectedVehicleId(null);
        localStorage.removeItem('selectedVehicleId');
      } else if (selectedVehicleId === vehicle.id) {
        setShowPanel(false);
        setTimeout(() => {
          setSelectedVehicleId(null);
          localStorage.removeItem('selectedVehicleId');
        }, 300);
      } else {
        setSelectedVehicleId(vehicle.id);
        setShowPanel(true);
        localStorage.setItem('selectedVehicleId', vehicle.id);
      }
    },
    [selectedVehicleId],
  );

  const collapseDetailPanelOnly = useCallback(() => {
    setShowPanel(false);
  }, []);

  const expandDetailPanel = useCallback(() => {
    if (selectedVehicleId) setShowPanel(true);
  }, [selectedVehicleId]);

  return (
    <div className='relative flex-1 h-screen rounded-md'>
      <TrackingPanel handleRightPanel={handleRightPanel} />
      <MapComponent selectedVehicle={selectedVehicle} />
      <MheStatusPanel
        onCollapsePanel={collapseDetailPanelOnly}
        onExpandPanel={expandDetailPanel}
        isShowPanel={showPanel}
        vehicle={selectedVehicle}
      />
    </div>
  );
}

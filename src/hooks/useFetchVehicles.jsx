import { APIURL } from '../constants';
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Lastvehicledata } from '../services';
import { fetchVehicles } from '../redux/vehiclesSlice';
import { setProcessedVehicles } from '../redux/multiTrackSlice';

const shallowEqual = (a, b) =>
  a === b ||
  (Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((v, i) => JSON.stringify(v) === JSON.stringify(b[i])));

export const useFetchVehicles = () => {
  const dispatch = useDispatch();
  const lastDataRef = useRef([]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      const company_id = localStorage.getItem('company_id');
      if (!token || !company_id) return;

      try {
        const res = await dispatch(fetchVehicles({ limit: 100 }));
        const vehicles = res?.payload?.vehicles || [];
        const validVehicles = vehicles.filter((v) => v?.imei_number);

        if (!validVehicles.length) return;

        const imeis = validVehicles.map((v) => v.imei_number);
        let lastData = [];

        for (let i = 0; i < imeis.length; i += 10) {
          const chunk = imeis.slice(i, i + 10);
          const results = await Promise.all(
            chunk.map(async (imei) => {
              try {
                const r = await Lastvehicledata.get(`${APIURL.LASTVEHICLEDATA}?imei=${imei}`);
                return r;
              } catch (err) {
                console.error('Error fetching last data for IMEI', imei, err);
                return null;
              }
            })
          );
          lastData.push(...results.flatMap((r) => (r?.success ? r.data : [])));
        }

        const enriched = validVehicles.map((v) => {
          const live = lastData.find((d) => d?.imei === v.imei_number);
          return { ...v, ...(live || {}), vehicle_name: v.vehicle_name };
        });

        if (mounted && !shallowEqual(lastDataRef.current, enriched)) {
          lastDataRef.current = enriched;
          dispatch(setProcessedVehicles(enriched));
        }
      } catch (e) {
        console.error('Error fetching vehicles:', e);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [dispatch]);
};

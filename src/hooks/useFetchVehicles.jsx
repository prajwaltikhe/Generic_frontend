import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchEnrichedVehicles } from '../redux/multiTrackSlice';

export const useFetchVehicles = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      const company_id = localStorage.getItem('company_id');
      if (!token || !company_id) return;
      dispatch(fetchEnrichedVehicles());
    };

    fetchData();
  }, [dispatch]);
};

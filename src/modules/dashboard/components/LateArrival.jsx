import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLateArrival } from '../../../redux/dashboardSlice';
import LateArrivalLineChart from '../charts/LateArrivalLineChart';

export default function LateArrival() {
  const dispatch = useDispatch();
  const weekChart = useSelector((state) => state.dashboard?.lateArrival?.weekChart);

  const { previousData, currentData, days } = useMemo(() => {
    const data = weekChart || [];
    return {
      previousData: data.map((d) => d.previous ?? 0),
      currentData: data.map((d) => d.current ?? 0),
      days: data.map((d) => d.day),
    };
  }, [weekChart]);
  const loading = useSelector((state) => state.dashboard?.loading);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchLateArrival({ company_id }));
  }, [dispatch]);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full pb-0 p-3'>
      {!loading ? (
        <LateArrivalLineChart
          previousData={previousData}
          currentData={currentData}
          categories={days}
          text='Late Arrival'
        />
      ) : (
        <div className='w-full flex justify-center items-center py-8'>
          <span className='text-xs text-gray-400 animate-pulse'>Loading...</span>
        </div>
      )}
    </div>
  );
}

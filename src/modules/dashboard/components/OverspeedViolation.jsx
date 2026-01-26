import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOverspeedViolation } from '../../../redux/dashboardSlice';
import OverspeedViolationLineChart from '../charts/OverspeedViolationLineChart';

export default function OverspeedViolation() {
  const dispatch = useDispatch();
  const { previousData, currentData, days } = useSelector((state) => {
    const data = state.dashboard?.overspeedViolation?.weekChart || [];
    return {
      previousData: data.map((d) => d.previous ?? 0),
      currentData: data.map((d) => d.current ?? 0),
      days: data.map((d) => d.day),
    };
  });
  const loading = useSelector((state) => state.dashboard?.loading);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    dispatch(fetchOverspeedViolation({ company_id }));
  }, [dispatch]);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full pb-0 p-3'>
      {!loading ? (
        <OverspeedViolationLineChart
          previousData={previousData}
          currentData={currentData}
          categories={days}
          text='Overspeed Violation'
        />
      ) : (
        <div className='w-full flex justify-center items-center py-8'>
          <span className='text-xs text-gray-400 animate-pulse'>Loading...</span>
        </div>
      )}
    </div>
  );
}

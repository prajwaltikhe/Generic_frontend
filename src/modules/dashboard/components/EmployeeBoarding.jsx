import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTotalOnboardEmp } from '../../../redux/dashboardSlice';
import EmployeeBoardingBarChart from '../charts/EmployeeBoardingBarChart';

export default function EmployeeBoarding() {
  const dispatch = useDispatch();
  const weekChart = useSelector((state) => state.dashboard?.totalOnboardEmp?.weekChart);

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
    dispatch(fetchTotalOnboardEmp({ company_id }));
  }, [dispatch]);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full pb-0 p-3'>
      {!loading ? (
        <EmployeeBoardingBarChart
          previousData={previousData}
          currentData={currentData}
          categories={days}
          text='Employee Boarding'
        />
      ) : (
        <div className='w-full flex justify-center items-center py-8'>
          <span className='text-xs text-gray-400 animate-pulse'>Loading...</span>
        </div>
      )}
    </div>
  );
}

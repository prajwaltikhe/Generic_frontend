import { useEffect, useState } from 'react';
import { APIURL } from '../../../constants/ApiURL';
import { ApiService } from '../../../services';
import LateArrivalLineChart from '../charts/LateArrivalLineChart';

export default function LateArrival() {
  const [chartData, setChartData] = useState({ previousData: [], currentData: [], days: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const company_id = localStorage.getItem('company_id');
    ApiService.get(APIURL.LATEARRIVAL, { company_id }).then((res) => {
      if (res?.success && Array.isArray(res.data?.weekChart)) {
        setChartData({
          previousData: res.data.weekChart.map((d) => d.previous ?? 0),
          currentData: res.data.weekChart.map((d) => d.current ?? 0),
          days: res.data.weekChart.map((d) => d.day),
        });
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className='shadow-sm rounded-sm bg-white w-full pb-0 p-3'>
      {!loading ? (
        <LateArrivalLineChart
          previousData={chartData.previousData}
          currentData={chartData.currentData}
          categories={chartData.days}
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

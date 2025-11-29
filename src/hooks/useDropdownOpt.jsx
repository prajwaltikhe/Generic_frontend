import { useEffect, useState } from 'react';
import { ApiService } from '../services';

export const useDropdownOpt = ({
  apiUrl,
  query,
  labelSelector = (item) => item.name,
  valueSelector = (item) => item.id,
  autoFetch = true,
  dataKey,
}) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchOption = async () => {
    if (!apiUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await ApiService.get(apiUrl, query);

      let rawData = [];
      if (Array.isArray(res?.data)) {
        rawData = res.data;
      } else if (dataKey && res?.data?.[dataKey]) {
        rawData = res.data[dataKey];
      } else if (res?.data?.data) {
        rawData = res.data.data;
      }

      const opt = rawData.map((item) => ({
        label: labelSelector(item),
        value: valueSelector(item),
      }));

      const uniqOpt = Array.from(new Map(opt.map((o) => [o.value, o])).values());
      setOptions(uniqOpt);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) fetchOption();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl, JSON.stringify(query), autoFetch]);

  useEffect(() => {}, [options]);

  return { options, loading, error, refetch: fetchOption };
};

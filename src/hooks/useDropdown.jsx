import { APIURL } from '../constants';
import { useDropdownOpt } from './useDropdownOpt';

export const useDropdown = (companyId) => {
  const employee = useDropdownOpt({
    apiUrl: APIURL.EMPLOYEE,
    queryParams: { company_id: companyId },
    labelSelector: (d) => `${d.first_name} ${d.last_name}`,
    valueSelector: (d) => d.id,
  });

  return { employee };
};

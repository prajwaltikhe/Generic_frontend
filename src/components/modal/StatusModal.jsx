const StatusModal = (onClose, onConfirm, record, entityName = 'Record') => {
  if (!record || !record.status) return null;

  const newStatus = record.status === 'Active' ? 'Inactive' : 'Active';
  return (
    <div className='p-4'>
      <h2 className='text-xl font-semibold mb-4 text-[#07163d]'>Change {entityName} Status</h2>
      <p className='mb-6'>
        Are you sure you want to change status of{' '}
        <strong>{record.driverName || record.employeeName || record.name || 'Unknown'}</strong> from{' '}
        <strong>{record.status}</strong> to <strong>{newStatus}</strong>?
      </p>
      <div className='flex justify-end gap-3'>
        <button className='px-4 py-2 rounded bg-gray-300 text-[#07163d] hover:bg-gray-400' onClick={onClose}>
          Cancel
        </button>
        <button className='px-4 py-2 rounded bg-[#07163d] text-white hover:bg-[#0a1a4a]' onClick={onConfirm}>
          Confirm
        </button>
      </div>
    </div>
  );
};

export default StatusModal;

import IModal from './Modal';

const DeleteModal = ({ confirmDeleteId, setConfirmDeleteId, handleDelete }) => {
  return (
    <IModal toggleModal={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>Plant</h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <form className='py-3 px-5' onSubmit={handleDelete}>
        <div className='mb-4'>
          <label htmlFor='name' className='block text-gray-700 font-bold mb-2'>
            Plant Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='name'
            className='w-full p-2 border border-gray-300 rounded-sm'
            placeholder='Enter plant name'
            name='name'
          />
        </div>
        <div className='flex justify-end'>
          <button
            type='submit'
            className='text-white bg-[#07163d] hover:bg-[#07163d] focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
            Save
          </button>
          <button
            type='button'
            onClick={() => setConfirmDeleteId(null)}
            className='text-white bg-gray-500 focus:outline-none font-medium rounded-sm text-sm px-5 py-2.5 text-center me-2 mb-2 cursor-pointer'>
            Close
          </button>
        </div>
      </form>
    </IModal>
  );
};

export default DeleteModal;

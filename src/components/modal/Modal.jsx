import { Modal, Box } from '@mui/material';

const IModal = ({ toggleModal, onClose, children }) => {
  return (
    <Modal
      open={toggleModal}
      onClose={onClose}
      aria-labelledby='modal-title'
      aria-describedby='modal-description'
      BackdropProps={{ invisible: false }}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'white',
          boxShadow: 24,
          borderRadius: 1,
          minWidth: '500px',
        }}>
        {children}
      </Box>
    </Modal>
  );
};

export default IModal;

import Modal from '../../components/Modal';
import ChangePasswordForm from './ChangePasswordForm';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ChangePasswordModal({ open, onClose }: Props) {
  return (
    <Modal title="Change password" open={open} onClose={onClose}>
      <ChangePasswordForm />
    </Modal>
  );
}

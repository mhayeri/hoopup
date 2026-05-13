import Modal from '../../components/Modal';
import DeleteAccountForm from './DeleteAccountForm';

type Props = {
  open: boolean;
  onClose: () => void;
  username: string;
};

export default function DeleteAccountModal({ open, onClose, username }: Props) {
  return (
    <Modal title="Delete account" open={open} onClose={onClose}>
      <DeleteAccountForm username={username} />
    </Modal>
  );
}

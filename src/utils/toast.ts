import toast from 'react-hot-toast';

export const showSuccess = (msg: string) =>
  toast.success(msg, { style: { background: '#c4714a', color: '#fff' } });

export const showError = (msg: string) => toast.error(msg);

export const showInfo = (msg: string) =>
  toast(msg, { style: { background: '#6b7280', color: '#fff' } });

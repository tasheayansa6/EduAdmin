import { useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fieldErrors } from '../lib/format.js';
import { validatePerson } from '../lib/validate.js';

/** Name is the only profile field the API lets a signed-in user change. */
export function useProfileForm() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user.name);
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePerson({ name });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setPending(true);
    try {
      const result = await api('/api/v1/auth/me', { method: 'PATCH', body: { name: name.trim() } });
      updateUser(result.user);
      toast.success('Profile updated.');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (!Object.keys(fields).length) toast.error(error.message);
    } finally {
      setPending(false);
    }
  }

  return { user, name, setName, errors, pending, onSubmit, dirty: name.trim() !== user.name };
}

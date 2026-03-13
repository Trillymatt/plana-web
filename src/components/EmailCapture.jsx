import { useState } from 'react';
import { useWaitlist } from '../hooks/useWaitlist';

export default function EmailCapture({ source }) {
  const [email, setEmail] = useState('');
  const { submit, status, error } = useWaitlist();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    await submit(email, source);
  }

  if (status === 'success') {
    return <p>You're on the list! We'll be in touch.</p>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
      />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>
      {status === 'error' && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

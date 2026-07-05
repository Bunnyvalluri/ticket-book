import { useEffect } from 'react';
import { useAuthStore } from '../../store/index.js';
import { authAPI } from '../../services/api.js';

// Initializes auth state from localStorage on app start
export default function AuthInitializer({ children }) {
  const { setUser, setToken, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    authAPI.getMe()
      .then(({ data }) => {
        setUser(data.data.user);
        setToken(token);
      })
      .catch(() => {
        logout();
      });
  }, []);

  return children;
}

import axios from 'axios';

const TOKEN_KEY = 'auth_token';

const api = axios.create({
    baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authGoogle = (credential: string) =>
    api.post<{ access_token: string; user: import('../types').UserResponse }>('/auth/google', { credential });

export { TOKEN_KEY };
export default api;

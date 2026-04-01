// URL base da API — configurada via variável de ambiente no build
// Desenvolvimento: defina VITE_API_URL no .env.local
// Produção: defina VITE_API_URL no .env.production ou na plataforma de deploy
export const API_BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080') + '/api/v1';

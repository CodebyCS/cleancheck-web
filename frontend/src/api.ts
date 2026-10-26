import axios from 'axios'

export type AppUser = {
    id: number
    name: string
    email: string
    role: 'admin' | 'supervisor' | 'prestador'
}

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 8000,
    withCredentials: true, 
    withXSRFToken: true,
    headers: { Accept: 'application/json' },
})

export function errorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        if (!error.response) {
            return 'Não foi possível contactar a API.'
        }
        if (error.response.status === 419) {
            return 'A sessão de segurança expirou. Tente novamente.'
        }
        if (error.response.status === 429) {
            return 'Tentativas excedidas. Aguarde alguns minutos e tente novamente'
        }

        return error.response.data?.message ?? 'O pedido falhou.'
    }
    return 'Ocorreu um erro inesperado.'
}
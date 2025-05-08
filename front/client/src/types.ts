export interface User {
    id: string;
    nombre: string;
    email: string;
}

export interface LoginResponse {
    success: boolean;
    user?: User;
    message?: string;
}
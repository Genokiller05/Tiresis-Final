import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GuardService {
    private apiUrl = 'http://localhost:3000/api';

    constructor(private http: HttpClient) { }

    /**
     * Obtiene todos los guardias.
     */
    async getGuards(): Promise<any[]> {
        return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/guards`));
    }

    /**
     * Obtiene un guardia específico por su ID de empleado.
     * @param id El idEmpleado del guardia.
     */
    async getGuardById(id: string): Promise<any> {
        return firstValueFrom(this.http.get<any>(`${this.apiUrl}/guards/${id}`));
    }

    /**
     * Actualiza los datos de un guardia.
     * @param id El idEmpleado del guardia a actualizar.
     * @param updateData Un objeto con los campos a actualizar.
     */
    async updateGuard(id: string, updateData: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/guards/${id}`, updateData));
    }

    /**
     * Sube un archivo de imagen al servidor local.
     * @param file El archivo a subir.
     */
    async uploadPhoto(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('photo', file);

        const response = await firstValueFrom(this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData));
        // The server returns a relative path like '/uploads/photo-123.jpg', we might need to prepend host if frontend needs absolute,
        // but currently frontend seems to prepend host or handle relative.
        // Let's return what server returns.
        return response.url;
    }

    /**
     * Crea un nuevo guardia.
     * @param guardData Los datos del guardia a crear.
     */
    async createGuard(guardData: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(`${this.apiUrl}/guards`, guardData));
    }
}

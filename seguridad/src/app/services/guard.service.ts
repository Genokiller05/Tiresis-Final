import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class GuardService {
    private apiUrl = environment.apiUrl;
    private guardUpdates = new Subject<any>();

    constructor(private http: HttpClient, private supabaseService: SupabaseService) {
        this.setupRealtimeSubscription();
    }

    private setupRealtimeSubscription() {
        this.supabaseService.client
            .channel('guards-channel')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'guards' },
                (payload) => {
                    console.log('Realtime change received! Guards:', payload);
                    this.guardUpdates.next(payload);
                }
            )
            .subscribe((status, err) => {
                if (err) console.error('Supabase Realtime subscription error (Guards):', err);
            });
    }

    getGuardUpdates(): Observable<any> {
        return this.guardUpdates.asObservable();
    }

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
     * Elimina un guardia.
     * @param id El idEmpleado del guardia a eliminar.
     */
    async deleteGuard(id: string): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/guards/${id}`));
    }

    /**
     * Crea un nuevo guardia.
     * @param guardData Los datos del guardia a crear.
     */
    async createGuard(guardData: any): Promise<any> {
        const response = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/guards`, guardData));
        return response?.guard ?? response;
    }
}

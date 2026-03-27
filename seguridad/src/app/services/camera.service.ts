import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CameraService {
    private apiUrl = `${environment.apiUrl}/cameras`;

    constructor(private http: HttpClient) { }

    async getCameras(): Promise<any[]> {
        return firstValueFrom(this.http.get<any[]>(this.apiUrl));
    }

    async createCamera(camera: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(this.apiUrl, camera));
    }

    async updateCamera(id: string, updates: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/${id}`, updates));
    }

    async deleteCamera(id: string): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/${id}`));
    }
}

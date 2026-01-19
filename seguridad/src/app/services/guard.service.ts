import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GuardService {
    private readonly apiUrl = 'http://localhost:3000/api/guards';

    constructor(private http: HttpClient) { }

    getGuards(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl);
    }

    getGuardById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    // Add more methods as needed (create, update, delete)
    updateGuard(id: string, guardData: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}`, guardData);
    }

    uploadPhoto(file: File): Observable<{ url: string }> {
        const formData = new FormData();
        formData.append('photo', file);
        return this.http.post<{ url: string }>('http://localhost:3000/api/upload', formData);
    }
}

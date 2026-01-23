import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class EntryExitService {
    private apiUrl = 'http://localhost:3000/api/entries-exits';

    constructor(private http: HttpClient) { }

    async getEntriesExits(): Promise<any[]> {
        return firstValueFrom(this.http.get<any[]>(this.apiUrl));
    }

    async createEntryExit(entry: any): Promise<any> {
        return firstValueFrom(this.http.post<any>(this.apiUrl, entry));
    }

    async updateEntryExit(id: string | number, updates: any): Promise<any> {
        return firstValueFrom(this.http.patch<any>(`${this.apiUrl}/${id}`, updates));
    }

    async deleteEntryExit(id: string | number): Promise<any> {
        return firstValueFrom(this.http.delete<any>(`${this.apiUrl}/${id}`));
    }
}

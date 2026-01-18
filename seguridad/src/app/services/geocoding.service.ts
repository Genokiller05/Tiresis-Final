import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GeocodingService {
    private readonly NAMIMATIM_URL = 'https://nominatim.openstreetmap.org/search';

    constructor(private http: HttpClient) { }

    searchAddress(query: string): Observable<{ lat: number, lon: number } | null> {
        const params = {
            q: query,
            format: 'json',
            limit: '1'
        };

        return this.http.get<any[]>(this.NAMIMATIM_URL, { params }).pipe(
            map(results => {
                if (results && results.length > 0) {
                    return {
                        lat: parseFloat(results[0].lat),
                        lon: parseFloat(results[0].lon)
                    };
                }
                return null;
            })
        );
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private readonly BASE_URL = 'https://countriesnow.space/api/v0.1/countries';

    constructor(private http: HttpClient) { }

    getCountries(): Observable<any[]> {
        return this.http.get<any>(this.BASE_URL).pipe(
            map(response => response.data.map((country: any) => ({
                name: country.country,
                iso2: country.iso2, // Useful if we need it later
                iso3: country.iso3
            })))
        );
    }

    getStates(countryName: string): Observable<string[]> {
        return this.http.post<any>(`${this.BASE_URL}/states`, { country: countryName }).pipe(
            map(response => response.data.states.map((state: any) => state.name))
        );
    }

    getCities(countryName: string, stateName: string): Observable<string[]> {
        return this.http.post<any>(`${this.BASE_URL}/state/cities`, { country: countryName, state: stateName }).pipe(
            map(response => response.data)
        );
    }
}

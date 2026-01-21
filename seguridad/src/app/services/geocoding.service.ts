import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, of, catchError, switchMap } from 'rxjs';

export interface AddressStructure {
    street: string;
    city: string;
    state: string;
    country: string;
}

@Injectable({
    providedIn: 'root'
})
export class GeocodingService {
    private readonly NAMIMATIM_URL = 'https://nominatim.openstreetmap.org/search';

    constructor(private http: HttpClient) { }

    // Backward compatibility for simple string search
    searchAddress(query: string): Observable<{ lat: number, lon: number, display_name?: string } | null> {
        const params = new HttpParams()
            .set('q', query)
            .set('format', 'json')
            .set('limit', '1');

        return this.http.get<any[]>(this.NAMIMATIM_URL, { params }).pipe(
            map(results => {
                if (results && results.length > 0) {
                    return {
                        lat: parseFloat(results[0].lat),
                        lon: parseFloat(results[0].lon),
                        display_name: results[0].display_name
                    };
                }
                return null;
            }),
            catchError(() => of(null))
        );
    }

    /**
     * Robust address search with multiple fallback strategies.
     * 1. Exact structured search.
     * 2. Normalized structured search (expanding abbreviations).
     * 3. Relaxed search (Street + City + State + Country).
     * 4. Fallback search (City + State + Country).
     */
    searchAddressStructured(address: AddressStructure): Observable<{ lat: number, lon: number, method: string, display_name: string } | null> {
        // Strategy 1: Exact Structured Search
        return this.searchStructuredInternal(address).pipe(
            switchMap(result => {
                if (result) return of({ ...result, method: 'Exact Structured' });

                // Strategy 2: Normalized Search
                const normalizedAddress = this.normalizeAddress(address);
                if (normalizedAddress.street !== address.street) {
                    return this.searchStructuredInternal(normalizedAddress).pipe(
                        switchMap(normResult => {
                            if (normResult) return of({ ...normResult, method: 'Normalized Structured' });
                            return this.performFallbackStrategies(address);
                        })
                    );
                }

                return this.performFallbackStrategies(address);
            })
        );
    }

    private performFallbackStrategies(address: AddressStructure): Observable<{ lat: number, lon: number, method: string, display_name: string } | null> {
        // Strategy 3: Relaxed Free-Text Search (Combined string)
        const relaxedQuery = `${this.cleanStreet(address.street)}, ${address.city}, ${address.state}, ${address.country}`;
        return this.searchAddress(relaxedQuery).pipe(
            switchMap(relaxedResult => {
                if (relaxedResult) {
                    return of({
                        ...relaxedResult,
                        display_name: relaxedResult.display_name || '',
                        method: 'Relaxed Free-Text'
                    });
                }

                // Strategy 4: City Fallback (Last resort - guarantees finding the general area)
                // We use standard searchAddress for this but construct query carefully
                const fallbackQuery = `${address.city}, ${address.state}, ${address.country}`;
                return this.searchAddress(fallbackQuery).pipe(
                    map(cityResult => {
                        if (cityResult) {
                            return {
                                ...cityResult,
                                display_name: cityResult.display_name || '',
                                method: 'City Fallback'
                            };
                        }
                        return null;
                    })
                );
            })
        );
    }

    private searchStructuredInternal(address: AddressStructure): Observable<{ lat: number, lon: number, display_name: string } | null> {
        // Nominatim structured query params
        // street=<housenumber> <streetname>
        // city=<city>
        // state=<state>
        // country=<country>

        let params = new HttpParams()
            .set('street', address.street)
            .set('city', address.city)
            .set('state', address.state)
            .set('country', address.country)
            .set('format', 'json')
            .set('limit', '1');

        return this.http.get<any[]>(this.NAMIMATIM_URL, { params }).pipe(
            map(results => {
                if (results && results.length > 0) {
                    return {
                        lat: parseFloat(results[0].lat),
                        lon: parseFloat(results[0].lon),
                        display_name: results[0].display_name
                    };
                }
                return null;
            }),
            catchError(() => of(null))
        );
    }

    private normalizeAddress(address: AddressStructure): AddressStructure {
        let street = address.street;

        // Improve "C." or "C " to "Calle "
        // \b matches word boundary
        street = street.replace(/\bC[\.\s]+(\d+|[A-Za-z]+)/gi, 'Calle $1');

        // Improve "Col." to "Colonia "
        street = street.replace(/\bCol[\.\s]+(?=[A-Za-z])/gi, 'Colonia ');

        // Improve "Av." to "Avenida "
        street = street.replace(/\bAv[\.\s]+(?=[A-Za-z])/gi, 'Avenida ');

        return { ...address, street: street.trim() };
    }

    private cleanStreet(street: string): string {
        // Remove explicitly likely problematic chars for free text search if any
        // For now, removing "No." or "#" might help if user typed "Calle 10 #20"
        return street.replace(/[#]/g, '');
    }
}


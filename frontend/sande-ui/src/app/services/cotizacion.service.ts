import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cotizacion } from '../models/cotizacion.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CotizacionService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cotizaciones`;

  getAll(): Observable<Cotizacion[]> {
    return this.http.get<Cotizacion[]>(this.apiUrl);
  }

  getById(id: number | string): Observable<Cotizacion> {
    return this.http.get<Cotizacion>(`${this.apiUrl}/${id}`);
  }

  create(cotizacion: Partial<Cotizacion>): Observable<Cotizacion> {
    return this.http.post<Cotizacion>(this.apiUrl, cotizacion);
  }
}

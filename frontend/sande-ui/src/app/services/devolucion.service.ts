import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DevolucionDetalle {
  id?: number;
  idDevolucion?: number;
  idProducto: number;
  nombreProducto: string;
  cantidad: number;
  montoReembolso: number;
}

export interface Devolucion {
  id?: number;
  fecha?: string;
  cliente: string;
  motivo: string;
  totalDevuelto: number;
  items: DevolucionDetalle[];
}

@Injectable({
  providedIn: 'root'
})
export class DevolucionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/devoluciones`;

  // Obtener todas las devoluciones registradas
  getAll(): Observable<Devolucion[]> {
    return this.http.get<Devolucion[]>(this.apiUrl);
  }

  // Obtener detalle por ID
  getById(id: number): Observable<Devolucion> {
    return this.http.get<Devolucion>(`${this.apiUrl}/${id}`);
  }

  // Registrar una nueva devolución
  create(devolucion: Devolucion): Observable<Devolucion> {
    return this.http.post<Devolucion>(this.apiUrl, devolucion);
  }
}

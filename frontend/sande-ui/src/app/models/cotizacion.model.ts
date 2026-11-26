export interface CotizacionItem {
  id?: number;
  idCotizacion?: number;
  idProducto: number;
  cantidad: number;
  precio: number;
}

export interface Cotizacion {
  id: number;
  personaCotizante: string;
  fecha: string;
  total: number;
  items: CotizacionItem[];
}

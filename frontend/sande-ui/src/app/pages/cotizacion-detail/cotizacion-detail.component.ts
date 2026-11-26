import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CotizacionService } from '../../services/cotizacion.service';
import { Cotizacion } from '../../models/cotizacion.model';

@Component({
  selector: 'app-cotizacion-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto py-8 px-4">
      <a routerLink="/cotizaciones" class="text-blue-600 hover:underline text-sm font-semibold mb-6 inline-block">
        ← Volver a Cotizaciones
      </a>

      <!-- Estado de Carga -->
      @if (isLoading) {
        <div class="text-center py-16 text-slate-400">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto mb-3"></div>
          <p>Cargando detalle de la cotización...</p>
        </div>
      }

      <!-- Estado de Error -->
      @else if (errorMessage) {
        <div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm text-center">
          <p class="font-semibold">{{ errorMessage }}</p>
        </div>
      }

      <!-- Detalle de la Cotización -->
      @else if (cotizacion) {
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-6">
          <div class="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span class="text-xs font-bold text-blue-600 uppercase tracking-widest">Cotización #{{ cotizacion.id }}</span>
              <h2 class="text-2xl font-black text-slate-800 mt-1">{{ cotizacion.personaCotizante }}</h2>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 block uppercase">Fecha de Emisión</span>
              <p class="text-sm font-semibold text-slate-700">{{ cotizacion.fecha | date:'dd/MM/yyyy HH:mm' }}</p>
            </div>
          </div>

          <!-- Tabla de Productos Cotizados -->
          <h3 class="text-md font-bold text-slate-800 mt-6 mb-3">Items Cotizados</h3>
          <div class="border border-slate-100 rounded-lg overflow-hidden">
            <table class="w-full text-left text-sm text-slate-600">
              <thead class="bg-slate-50 text-slate-700 font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th class="py-2.5 px-4"># Producto ID</th>
                  <th class="py-2.5 px-4">Cantidad</th>
                  <th class="py-2.5 px-4">Precio Unitario</th>
                  <th class="py-2.5 px-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of cotizacion.items; track item.id) {
                  <tr>
                    <td class="py-2.5 px-4 font-semibold text-slate-800">Producto #{{ item.idProducto }}</td>
                    <td class="py-2.5 px-4">{{ item.cantidad }} u.</td>
                    <td class="py-2.5 px-4">\${{ item.precio | number }}</td>
                    <td class="py-2.5 px-4 font-bold text-slate-900 text-right">\${{ (item.cantidad * item.precio) | number }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="py-4 text-center text-slate-400">No hay productos en esta cotización.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Total al final -->
          <div class="mt-6 flex justify-end">
            <div class="bg-slate-50 p-4 rounded-xl text-right min-w-[200px]">
              <span class="text-xs text-slate-400 font-bold uppercase block">Monto Total</span>
              <p class="text-3xl font-black text-slate-900 mt-1">\${{ cotizacion.total | number }}</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CotizacionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private cotizacionService = inject(CotizacionService);
  private cdr = inject(ChangeDetectorRef);

  cotizacion: Cotizacion | null = null;
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadDetail(id);
      } else {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadDetail(id: string) {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.cotizacionService.getById(id).subscribe({
      next: (data) => {
        this.cotizacion = data;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar detalle de cotización:', err);
        this.errorMessage = 'No se pudo cargar la cotización o no existe.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
}

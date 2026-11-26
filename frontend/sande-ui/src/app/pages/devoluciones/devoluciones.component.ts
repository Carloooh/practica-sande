import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DevolucionService, Devolucion, DevolucionDetalle } from '../../services/devolucion.service';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-devoluciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './devoluciones.component.html'
})
export class DevolucionesComponent implements OnInit {
  private devolucionService = inject(DevolucionService);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);

  // Estados de datos
  devoluciones: Devolucion[] = [];
  productosDisponibles: Product[] = [];
  cargando = false;
  mensajeExito = '';
  mensajeError = '';

  // Modelo del formulario de nueva devolución
  nuevoCliente = '';
  nuevoMotivo = '';
  itemsADevolver: DevolucionDetalle[] = [];

  // Inputs temporales para agregar un ítem al listado
  productoSeleccionadoId = 0;
  cantidadSeleccionada = 1;

  // Devolución seleccionada para ver su detalle en pantalla
  devolucionSeleccionada: Devolucion | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    // 1. Cargar historial de devoluciones
    this.devolucionService.getAll().subscribe({
      next: (data) => {
        this.devoluciones = data;
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al cargar devoluciones:', err);
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });

    // 2. Cargar catálogo de productos para el selector
    this.productService.getAll().subscribe({
      next: (prods: Product[]) => {
        this.productosDisponibles = prods;
        if (prods.length > 0) {
          this.productoSeleccionadoId = prods[0].id;
        }
        this.cdr.markForCheck();
      }
    });
  }

  // Agrega un producto a la lista temporal de ítems a devolver
  agregarItem(): void {
    if (this.productoSeleccionadoId <= 0 || this.cantidadSeleccionada <= 0) return;

    const producto = this.productosDisponibles.find(p => p.id === Number(this.productoSeleccionadoId));
    if (!producto) return;

    // Ver si ya estaba en la lista para solo sumar cantidad
    const existente = this.itemsADevolver.find(i => i.idProducto === producto.id);
    if (existente) {
      existente.cantidad += Number(this.cantidadSeleccionada);
      existente.montoReembolso = existente.cantidad * producto.price;
    } else {
      this.itemsADevolver.push({
        idProducto: producto.id,
        nombreProducto: producto.name,
        cantidad: Number(this.cantidadSeleccionada),
        montoReembolso: Number(this.cantidadSeleccionada) * producto.price
      });
    }

    // Resetear cantidad
    this.cantidadSeleccionada = 1;
    this.cdr.markForCheck();
  }

  // Quitar un ítem de la lista temporal
  quitarItem(index: number): void {
    this.itemsADevolver.splice(index, 1);
    this.cdr.markForCheck();
  }

  // Calcular el total a reembolsar de los ítems agregados
  calcularTotalTemporal(): number {
    return this.itemsADevolver.reduce((sum, item) => sum + item.montoReembolso, 0);
  }

  // Enviar la devolución completa a la API
  guardarDevolucion(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.nuevoCliente.trim()) {
      this.mensajeError = 'Debes ingresar el nombre del cliente.';
      return;
    }
    if (!this.nuevoMotivo.trim()) {
      this.mensajeError = 'Debes especificar el motivo de la devolución.';
      return;
    }
    if (this.itemsADevolver.length === 0) {
      this.mensajeError = 'Debes agregar al menos un producto a devolver.';
      return;
    }

    const payload: Devolucion = {
      cliente: this.nuevoCliente.trim(),
      motivo: this.nuevoMotivo.trim(),
      totalDevuelto: this.calcularTotalTemporal(),
      items: this.itemsADevolver
    };

    this.devolucionService.create(payload).subscribe({
      next: (creada) => {
        this.mensajeExito = `¡Devolución #${creada.id} registrada con éxito!`;
        // Limpiar formulario
        this.nuevoCliente = '';
        this.nuevoMotivo = '';
        this.itemsADevolver = [];
        // Recargar listado
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al guardar devolución:', err);
        this.mensajeError = 'Ocurrió un error al registrar la devolución.';
        this.cdr.markForCheck();
      }
    });
  }

  verDetalle(dev: Devolucion): void {
    this.devolucionSeleccionada = dev;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.devolucionSeleccionada = null;
    this.cdr.markForCheck();
  }
}

namespace Sande.Api.Models;

public class Cotizacion
{
    public int Id { get; set; }
    public string PersonaCotizante { get; set; } = string.Empty;
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public decimal Total { get; set; }

    // Lista de productos incluidos en esta cotización
    public List<CotizacionProductos> Items { get; set; } = new();
}

public class CotizacionProductos 
{
    public int Id { get; set; }
    public int IdCotizacion { get; set; }
    public int IdProducto { get; set; }
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
}
namespace Sande.Api.Models;

public class Devolucion
{
    public int Id { get; set; }
    public DateTime Fecha { get; set; } = DateTime.UtcNow;
    public string Cliente { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public decimal TotalDevuelto { get; set; }

    // Lista de ítems devueltos en esta solicitud
    public List<DevolucionDetalle> Items { get; set; } = new();
}

public class DevolucionDetalle
{
    public int Id { get; set; }
    public int IdDevolucion { get; set; }
    public int IdProducto { get; set; }
    public string NombreProducto { get; set; } = string.Empty;
    public int Cantidad { get; set; }
    public decimal MontoReembolso { get; set; }
}

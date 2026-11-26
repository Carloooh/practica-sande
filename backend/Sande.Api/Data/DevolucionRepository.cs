using Microsoft.Data.SqlClient;
using Sande.Api.Models;

namespace Sande.Api.Data;

public class DevolucionRepository
{
    private readonly string _connectionString;

    public DevolucionRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Cadena de conexión 'DefaultConnection' no configurada.");
    }

    // =========================================================================
    // 1. OBTENER TODAS LAS DEVOLUCIONES CON SUS DETALLES
    // =========================================================================
    /*
    -------------------------------------------------------------------------
    CÓMO SERÍA ESTE GET CON ENTITY FRAMEWORK (EF Core):
    -------------------------------------------------------------------------
    public async Task<List<Devolucion>> GetAllWithEF(AppDbContext context)
    {
        return await context.Devoluciones
            .Include(d => d.Items)
            .OrderByDescending(d => d.Fecha)
            .ToListAsync();
    }
    -------------------------------------------------------------------------
    */
    public async Task<List<Devolucion>> GetAllAsync()
    {
        var devolucionesDict = new Dictionary<int, Devolucion>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT 
                d.Id, d.Fecha, d.Cliente, d.Motivo, d.TotalDevuelto,
                dt.Id AS DetalleId, dt.IdProducto, dt.NombreProducto, dt.Cantidad, dt.MontoReembolso
            FROM Devoluciones d
            LEFT JOIN DevolucionDetalles dt ON d.Id = dt.IdDevolucion
            ORDER BY d.Fecha DESC";

        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var devolucionId = reader.GetInt32(0);

            // 1. Si no existe en el diccionario, inicializar cabecera
            if (!devolucionesDict.TryGetValue(devolucionId, out var devolucion))
            {
                devolucion = new Devolucion
                {
                    Id = devolucionId,
                    Fecha = reader.GetDateTime(1),
                    Cliente = reader.GetString(2),
                    Motivo = reader.GetString(3),
                    TotalDevuelto = reader.GetDecimal(4),
                    Items = new List<DevolucionDetalle>()
                };
                devolucionesDict.Add(devolucionId, devolucion);
            }

            // 2. Si la fila contiene un detalle (LEFT JOIN puede traer NULL si no hay items)
            if (!reader.IsDBNull(5))
            {
                devolucion.Items.Add(new DevolucionDetalle
                {
                    Id = reader.GetInt32(5),
                    IdDevolucion = devolucionId,
                    IdProducto = reader.GetInt32(6),
                    NombreProducto = reader.GetString(7),
                    Cantidad = reader.GetInt32(8),
                    MontoReembolso = reader.GetDecimal(9)
                });
            }
        }

        return devolucionesDict.Values.ToList();
    }

    // =========================================================================
    // 2. OBTENER DEVOLUCIÓN POR ID
    // =========================================================================
    /*
    -------------------------------------------------------------------------
    CÓMO SERÍA ESTE GET-BY-ID CON ENTITY FRAMEWORK (EF Core):
    -------------------------------------------------------------------------
    public async Task<Devolucion?> GetByIdWithEF(AppDbContext context, int id)
    {
        return await context.Devoluciones
            .Include(d => d.Items)
            .FirstOrDefaultAsync(d => d.Id == id);
    }
    -------------------------------------------------------------------------
    */
    public async Task<Devolucion?> GetByIdAsync(int id)
    {
        Devolucion? devolucion = null;

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT 
                d.Id, d.Fecha, d.Cliente, d.Motivo, d.TotalDevuelto,
                dt.Id AS DetalleId, dt.IdProducto, dt.NombreProducto, dt.Cantidad, dt.MontoReembolso
            FROM Devoluciones d
            LEFT JOIN DevolucionDetalles dt ON d.Id = dt.IdDevolucion
            WHERE d.Id = @Id";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            if (devolucion == null)
            {
                devolucion = new Devolucion
                {
                    Id = reader.GetInt32(0),
                    Fecha = reader.GetDateTime(1),
                    Cliente = reader.GetString(2),
                    Motivo = reader.GetString(3),
                    TotalDevuelto = reader.GetDecimal(4),
                    Items = new List<DevolucionDetalle>()
                };
            }

            if (!reader.IsDBNull(5))
            {
                devolucion.Items.Add(new DevolucionDetalle
                {
                    Id = reader.GetInt32(5),
                    IdDevolucion = devolucion.Id,
                    IdProducto = reader.GetInt32(6),
                    NombreProducto = reader.GetString(7),
                    Cantidad = reader.GetInt32(8),
                    MontoReembolso = reader.GetDecimal(9)
                });
            }
        }

        return devolucion;
    }

    // =========================================================================
    // 3. REGISTRAR DEVOLUCIÓN CON TRANSACCIÓN (SQL PURO)
    // =========================================================================
    /*
    -------------------------------------------------------------------------
    CÓMO SERÍA ESTE INSERT CON ENTITY FRAMEWORK (EF Core):
    -------------------------------------------------------------------------
    public async Task<int> CreateWithEF(AppDbContext context, Devolucion devolucion)
    {
        // EF Core automáticamente maneja la transacción y asigna el Id generado
        // a la entidad padre y las claves foráneas a los hijos al llamar a SaveChangesAsync.
        context.Devoluciones.Add(devolucion);
        await context.SaveChangesAsync();
        return devolucion.Id;
    }
    -------------------------------------------------------------------------
    */
    public async Task<int> CreateAsync(Devolucion devolucion)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        // Iniciamos transacción para asegurar que o se guarda todo (cabecera + items) o nada
        using var transaction = connection.BeginTransaction();

        try
        {
            // 1. Insertar Cabecera y obtener el ID generado con SCOPE_IDENTITY()
            var sqlCabecera = @"
                INSERT INTO Devoluciones (Fecha, Cliente, Motivo, TotalDevuelto)
                VALUES (@Fecha, @Cliente, @Motivo, @TotalDevuelto);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            using var cmdCabecera = new SqlCommand(sqlCabecera, connection, transaction);
            cmdCabecera.Parameters.AddWithValue("@Fecha", devolucion.Fecha == default ? DateTime.UtcNow : devolucion.Fecha);
            cmdCabecera.Parameters.AddWithValue("@Cliente", devolucion.Cliente);
            cmdCabecera.Parameters.AddWithValue("@Motivo", devolucion.Motivo);
            cmdCabecera.Parameters.AddWithValue("@TotalDevuelto", devolucion.TotalDevuelto);

            var scalarResult = await cmdCabecera.ExecuteScalarAsync();
            var devolucionId = Convert.ToInt32(scalarResult);

            // 2. Insertar cada detalle asociado a la devolución
            if (devolucion.Items != null && devolucion.Items.Any())
            {
                var sqlDetalle = @"
                    INSERT INTO DevolucionDetalles (IdDevolucion, IdProducto, NombreProducto, Cantidad, MontoReembolso)
                    VALUES (@IdDevolucion, @IdProducto, @NombreProducto, @Cantidad, @MontoReembolso);";

                foreach (var item in devolucion.Items)
                {
                    using var cmdDetalle = new SqlCommand(sqlDetalle, connection, transaction);
                    cmdDetalle.Parameters.AddWithValue("@IdDevolucion", devolucionId);
                    cmdDetalle.Parameters.AddWithValue("@IdProducto", item.IdProducto);
                    cmdDetalle.Parameters.AddWithValue("@NombreProducto", item.NombreProducto ?? string.Empty);
                    cmdDetalle.Parameters.AddWithValue("@Cantidad", item.Cantidad);
                    cmdDetalle.Parameters.AddWithValue("@MontoReembolso", item.MontoReembolso);

                    await cmdDetalle.ExecuteNonQueryAsync();
                }
            }

            // Confirmar transacción
            await transaction.CommitAsync();
            return devolucionId;
        }
        catch
        {
            // Revertir cambios en caso de error
            await transaction.RollbackAsync();
            throw;
        }
    }
}

using Microsoft.Data.SqlClient;
using Sande.Api.Models;

namespace Sande.Api.Data;

public class CotizacionRepository     
{
   private readonly string _connectionString; 

   public CotizacionRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Cadena de conexión no configurada.");
    }


    public async Task<List<Cotizacion>> GetAllAsync()
{
    // Usamos un diccionario para agrupar por Id y no duplicar cotizaciones
    var cotizacionesDict = new Dictionary<int, Cotizacion>();

    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync();

    var query = @"
        SELECT 
            c.Id, c.PersonaCotizante, c.Fecha, c.Total,
            cp.Id AS ItemId, cp.IdProducto, cp.Cantidad, cp.Precio
        FROM Cotizaciones c
        LEFT JOIN CotizacionProductos cp ON c.Id = cp.IdCotizacion
        ORDER BY c.Fecha DESC";

    using var command = new SqlCommand(query, connection);
    using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        var cotizacionId = reader.GetInt32(0);

        // 1. Si la cotización no está en el diccionario, la creamos
        if (!cotizacionesDict.TryGetValue(cotizacionId, out var cotizacion))
        {
            cotizacion = new Cotizacion
            {
                Id = cotizacionId,
                PersonaCotizante = reader.GetString(1),
                Fecha = reader.GetDateTime(2),
                Total = reader.GetDecimal(3),
                Items = new List<CotizacionProductos>()
            };
            cotizacionesDict.Add(cotizacionId, cotizacion);
        }

        // 2. Si tiene un producto asociado (no es NULL), lo agregamos a la lista
        if (!reader.IsDBNull(4)) // Columna ItemId
        {
            cotizacion.Items.Add(new CotizacionProductos
            {
                Id = reader.GetInt32(4),
                IdCotizacion = cotizacionId,
                IdProducto = reader.GetInt32(5),
                Cantidad = reader.GetInt32(6),
                Precio = reader.GetDecimal(7)
            });
        }
    }

    // Devolvemos solo la lista de valores
    return cotizacionesDict.Values.ToList();
}

public async Task<int> CreateAsync(Cotizacion cotizacion)
{
    // 1. Calcular el total automáticamente sumando (Cantidad * Precio) de cada item
    cotizacion.Total = cotizacion.Items.Sum(item => item.Cantidad * item.Precio);
    cotizacion.Fecha = DateTime.UtcNow;

    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync();

    // 2. Iniciamos la transacción (fundamental en entrevistas cuando hay 2 tablas)
    using var transaction = connection.BeginTransaction();

    try
    {
        // 3. Insertar la Cabecera (Cotizaciones) y capturar el nuevo ID generado
        var queryCotizacion = @"
            INSERT INTO Cotizaciones (PersonaCotizante, Fecha, Total)
            VALUES (@PersonaCotizante, @Fecha, @Total);
            SELECT CAST(SCOPE_IDENTITY() as int);";

        using var cmdCotizacion = new SqlCommand(queryCotizacion, connection, transaction);
        cmdCotizacion.Parameters.AddWithValue("@PersonaCotizante", cotizacion.PersonaCotizante);
        cmdCotizacion.Parameters.AddWithValue("@Fecha", cotizacion.Fecha);
        cmdCotizacion.Parameters.AddWithValue("@Total", cotizacion.Total);

        var nuevoId = Convert.ToInt32(await cmdCotizacion.ExecuteScalarAsync());

        // 4. Insertar cada producto asociado en CotizacionProductos
        var queryItem = @"
            INSERT INTO CotizacionProductos (IdCotizacion, IdProducto, Cantidad, Precio)
            VALUES (@IdCotizacion, @IdProducto, @Cantidad, @Precio);";

        foreach (var item in cotizacion.Items)
        {
            using var cmdItem = new SqlCommand(queryItem, connection, transaction);
            cmdItem.Parameters.AddWithValue("@IdCotizacion", nuevoId);
            cmdItem.Parameters.AddWithValue("@IdProducto", item.IdProducto);
            cmdItem.Parameters.AddWithValue("@Cantidad", item.Cantidad);
            cmdItem.Parameters.AddWithValue("@Precio", item.Precio);

            await cmdItem.ExecuteNonQueryAsync();
        }

        // 5. Si todo salió bien, confirmamos los cambios en la base de datos
        await transaction.CommitAsync();

        return nuevoId;
    }
    catch
    {
        // Si algo falló, revertimos todo
        await transaction.RollbackAsync();
        throw;
    }
}



public async Task<Cotizacion?> GetByIdAsync(int id)
{
    Cotizacion? cotizacion = null;

    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync();

    var query = @"
        SELECT 
            c.Id, c.PersonaCotizante, c.Fecha, c.Total,
            cp.Id AS ItemId, cp.IdProducto, cp.Cantidad, cp.Precio
        FROM Cotizaciones c
        LEFT JOIN CotizacionProductos cp ON c.Id = cp.IdCotizacion
        WHERE c.Id = @Id";

    using var command = new SqlCommand(query, connection);
    command.Parameters.AddWithValue("@Id", id);

    using var reader = await command.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        if (cotizacion == null)
        {
            cotizacion = new Cotizacion
            {
                Id = reader.GetInt32(0),
                PersonaCotizante = reader.GetString(1),
                Fecha = reader.GetDateTime(2),
                Total = reader.GetDecimal(3),
                Items = new List<CotizacionProductos>()
            };
        }

        if (!reader.IsDBNull(4))
        {
            cotizacion.Items.Add(new CotizacionProductos
            {
                Id = reader.GetInt32(4),
                IdCotizacion = id,
                IdProducto = reader.GetInt32(5),
                Cantidad = reader.GetInt32(6),
                Precio = reader.GetDecimal(7)
            });
        }
    }

    return cotizacion;
}
}
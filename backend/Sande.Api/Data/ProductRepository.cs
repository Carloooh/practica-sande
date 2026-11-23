using Microsoft.Data.SqlClient;
using Sande.Api.Models;

namespace Sande.Api.Data;

public class ProductRepository
{
    private readonly string _connectionString;

    public ProductRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Cadena de conexión no configurada.");
    }

    // Consulta SQL directa con SqlDataReader (SELECT)
    public async Task<List<Product>> GetAllAsync()
    {
        var products = new List<Product>();

        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT Id, Name, Description, Price, Stock FROM Products";
        using var command = new SqlCommand(query, connection);
        using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            products.Add(new Product
            {
                Id = reader.GetInt32(0),
                Name = reader.GetString(1),
                Description = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                Price = reader.GetDecimal(3),
                Stock = reader.GetInt32(4)
            });
        }

        return products;
    }

    // Consulta SQL directa por ID
    public async Task<Product?> GetByIdAsync(int id)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT Id, Name, Description, Price, Stock FROM Products WHERE Id = @Id";
        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Id", id);

        using var reader = await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new Product
            {
                Id = reader.GetInt32(0),
                Name = reader.GetString(1),
                Description = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                Price = reader.GetDecimal(3),
                Stock = reader.GetInt32(4)
            };
        }

        return null;
    }

    // Consulta SQL directa INSERT
    public async Task<int> CreateAsync(Product product)
    {
        using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO Products (Name, Description, Price, Stock)
                      VALUES (@Name, @Description, @Price, @Stock);
                      SELECT CAST(SCOPE_IDENTITY() as int);";

        using var command = new SqlCommand(query, connection);
        command.Parameters.AddWithValue("@Name", product.Name);
        command.Parameters.AddWithValue("@Description", (object?)product.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("@Price", product.Price);
        command.Parameters.AddWithValue("@Stock", product.Stock);

        var result = await command.ExecuteScalarAsync();
        return Convert.ToInt32(result);
    }
}

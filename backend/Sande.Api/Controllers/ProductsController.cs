using Microsoft.AspNetCore.Mvc;
using Sande.Api.Data;
using Sande.Api.Models;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly ProductRepository _repository;

    public ProductsController(ProductRepository repository)
    {
        _repository = repository;
    }

    // GET: api/products (Consulta directa SQL)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var products = await _repository.GetAllAsync();
        return Ok(products);
    }

    // GET: api/products/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _repository.GetByIdAsync(id);
        if (product == null)
            return NotFound();

        return Ok(product);
    }

    // POST: api/products
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        if (string.IsNullOrWhiteSpace(product.Name))
            return BadRequest(new { message = "El nombre es obligatorio." });

        var id = await _repository.CreateAsync(product);
        product.Id = id;

        return CreatedAtAction(nameof(GetById), new { id }, product);
    }
}

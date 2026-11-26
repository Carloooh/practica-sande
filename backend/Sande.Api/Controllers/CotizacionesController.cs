using Microsoft.AspNetCore.Mvc;
using Sande.Api.Data;
using Sande.Api.Models;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CotizacionesController : ControllerBase
{
    private readonly CotizacionRepository _repository;

    public CotizacionesController(CotizacionRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var cotizaciones = await _repository.GetAllAsync();
        return Ok(cotizaciones);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var cotizacion = await _repository.GetByIdAsync(id);
        if (cotizacion == null) {
            return NotFound();
        }
        return Ok(cotizacion);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Cotizacion cotizacion)
    {
        if (string.IsNullOrWhiteSpace(cotizacion.PersonaCotizante)){
            return BadRequest(new { message = "El nombre es obligatorio." });
        }
        var id = await _repository.CreateAsync(cotizacion);
        cotizacion.Id = id;

        return CreatedAtAction(nameof(GetById), new { id }, cotizacion);
    }
}
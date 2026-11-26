using Microsoft.AspNetCore.Mvc;
using Sande.Api.Data;
using Sande.Api.Models;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevolucionesController : ControllerBase
{
    private readonly DevolucionRepository _repository;

    public DevolucionesController(DevolucionRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var devoluciones = await _repository.GetAllAsync();
        return Ok(devoluciones);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var devolucion = await _repository.GetByIdAsync(id);
        if (devolucion == null)
        {
            return NotFound(new { message = $"Devolución con ID {id} no encontrada." });
        }
        return Ok(devolucion);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Devolucion devolucion)
    {
        if (string.IsNullOrWhiteSpace(devolucion.Cliente))
        {
            return BadRequest(new { message = "El nombre del cliente es obligatorio." });
        }

        if (string.IsNullOrWhiteSpace(devolucion.Motivo))
        {
            return BadRequest(new { message = "El motivo de la devolución es obligatorio." });
        }

        if (devolucion.Items == null || !devolucion.Items.Any())
        {
            return BadRequest(new { message = "Debe incluir al menos un producto a devolver." });
        }

        // Si el total no viene calculado, lo calculamos sumando los montos de reembolso
        if (devolucion.TotalDevuelto <= 0)
        {
            devolucion.TotalDevuelto = devolucion.Items.Sum(i => i.MontoReembolso);
        }

        var id = await _repository.CreateAsync(devolucion);
        devolucion.Id = id;

        return CreatedAtAction(nameof(GetById), new { id }, devolucion);
    }
}

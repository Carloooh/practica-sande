using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Sande.Api.Data;
using Sande.Api.Models;

namespace Sande.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Requiere Token JWT para acceder a los endpoints
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PasswordHasher<User> _passwordHasher = new();

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _context.Users
            .AsNoTracking()
            .Select(u => new UserResponse
            {
                Id = u.Id,
                Username = u.Username,
                Role = u.Role,
                IsActive = u.IsActive
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        return Ok(new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role,
            IsActive = user.IsActive
        });
    }

    [HttpPost]
    [AllowAnonymous] // Permitir crear usuario sin token (útil para registrarse o pruebas)
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var exists = await _context.Users.AnyAsync(u => u.Username == request.Username);
        if (exists)
            return Conflict(new { message = "El usuario ya existe." });

        var user = new User
        {
            Username = request.Username,
            Role = request.Role,
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserResponse
        {
            Id = user.Id,
            Username = user.Username,
            Role = user.Role,
            IsActive = user.IsActive
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")] // Solo administradores pueden dar de baja
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound();

        user.IsActive = false; // Baja lógica
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

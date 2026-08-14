namespace Turritopsis.Application.Auth.Models;

// A signup always creates the company at the same time — matches the
// product: there's no user without a company, and the signer-upper is
// always that company's owner.
public record RegisterRequest(
    string Email,
    string Password,
    string CompanyName,
    string Sector,
    string? City);

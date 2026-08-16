using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Turritopsis.Application.Abstractions;
using Turritopsis.Application.Ai;
using Turritopsis.Application.Ai.Models;
using Turritopsis.Application.Common;
using Turritopsis.Application.Dossiers.Models;
using Turritopsis.Domain.Entities;
using Turritopsis.Domain.Enums;
using Turritopsis.Infrastructure.Persistence;

namespace Turritopsis.Infrastructure.Dossiers;

public class DossierService : IDossierService
{
    private static readonly DossierStatus[] QueueStatuses = { DossierStatus.Submitted, DossierStatus.InReview };

    private readonly TurritopsisDbContext _db;

    public DossierService(TurritopsisDbContext db)
    {
        _db = db;
    }

    public async Task<DossierListResult> GetQueueAsync(bool isReviewer, CancellationToken cancellationToken)
    {
        if (!isReviewer) return new DossierListResult(MembershipAccess.Forbidden, Array.Empty<DossierDto>());

        var dossiers = await _db.Dossiers
            .Include(d => d.Company)
            .Where(d => QueueStatuses.Contains(d.Status))
            .OrderByDescending(d => d.SubmittedAt)
            .ToListAsync(cancellationToken);

        return new DossierListResult(MembershipAccess.Granted, dossiers.Select(ToDto).ToList());
    }

    public async Task<DossierResult> GetForCompanyOwnerAsync(Guid userId, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null) return new DossierResult(MembershipAccess.Forbidden, null);

        var dossier = await _db.Dossiers
            .Include(d => d.Company)
            .Where(d => d.CompanyId == membership.CompanyId)
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new DossierResult(MembershipAccess.Granted, dossier is null ? null : ToDto(dossier));
    }

    public async Task<DossierResult> GetByIdAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var dossier = await _db.Dossiers.Include(d => d.Company).FirstOrDefaultAsync(d => d.Id == dossierId, cancellationToken);
        if (dossier is null) return new DossierResult(MembershipAccess.NotFound, null);

        if (!isReviewer)
        {
            var membership = await FindMembershipAsync(userId, cancellationToken);
            if (membership is null || membership.CompanyId != dossier.CompanyId)
            {
                return new DossierResult(MembershipAccess.Forbidden, null);
            }
        }

        return new DossierResult(MembershipAccess.Granted, ToDto(dossier));
    }

    public async Task<DossierResult> SubmitAsync(Guid userId, int? declaredScore, int? reviewedScore, CancellationToken cancellationToken)
    {
        var membership = await FindMembershipAsync(userId, cancellationToken);
        if (membership is null || membership.Role == CompanyRole.Viewer)
        {
            return new DossierResult(MembershipAccess.Forbidden, null);
        }

        var snapshot = await _db.EsgSnapshots.FirstOrDefaultAsync(s => s.CompanyId == membership.CompanyId, cancellationToken);
        var snapshotJson = snapshot?.DataJson ?? "{}";

        // Re-submitting reuses the existing dossier unless it's already been
        // signed off — a validated dossier is a closed record.
        var existing = await _db.Dossiers
            .Where(d => d.CompanyId == membership.CompanyId && d.Status != DossierStatus.Validated)
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        Dossier dossier;
        if (existing is not null)
        {
            existing.Status = DossierStatus.Submitted;
            existing.DeclaredScore = declaredScore;
            existing.ReviewedScore = reviewedScore;
            existing.SnapshotJson = snapshotJson;
            existing.SubmittedBy = userId;
            existing.SubmittedAt = now;
            existing.UpdatedAt = now;
            dossier = existing;
        }
        else
        {
            dossier = new Dossier
            {
                Id = Guid.NewGuid(),
                CompanyId = membership.CompanyId,
                Status = DossierStatus.Submitted,
                DeclaredScore = declaredScore,
                ReviewedScore = reviewedScore,
                SnapshotJson = snapshotJson,
                SubmittedBy = userId,
                SubmittedAt = now,
                UpdatedAt = now,
                CreatedAt = now
            };
            _db.Dossiers.Add(dossier);
        }

        await _db.SaveChangesAsync(cancellationToken);
        await LogAsync(userId, dossier.CompanyId, "dossier.submit", cancellationToken);
        return new DossierResult(MembershipAccess.Granted, ToDto(dossier));
    }

    public async Task<DossierResult> UpdateStatusAsync(Guid userId, Guid dossierId, string status, int? finalScore, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<DossierStatus>(status, out var parsedStatus))
        {
            return new DossierResult(MembershipAccess.NotFound, null);
        }

        var dossier = await _db.Dossiers.FirstOrDefaultAsync(d => d.Id == dossierId, cancellationToken);
        if (dossier is null) return new DossierResult(MembershipAccess.NotFound, null);

        dossier.Status = parsedStatus;
        if (finalScore is not null) dossier.FinalScore = finalScore;
        if (parsedStatus is DossierStatus.InReview or DossierStatus.Validated)
        {
            dossier.ReviewerId = userId;
            dossier.ReviewedAt = DateTimeOffset.UtcNow;
        }
        dossier.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(cancellationToken);
        await LogAsync(userId, dossier.CompanyId, $"dossier.{status.ToLowerInvariant()}", cancellationToken);
        return new DossierResult(MembershipAccess.Granted, ToDto(dossier));
    }

    public async Task<DossierNoteListResult> GetNotesAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var access = await CheckDossierAccessAsync(userId, isReviewer, dossierId, cancellationToken);
        if (access != MembershipAccess.Granted) return new DossierNoteListResult(access, Array.Empty<DossierNoteDto>());

        var notes = await _db.DossierNotes
            .Where(n => n.DossierId == dossierId)
            .OrderBy(n => n.CreatedAt)
            .Select(n => new DossierNoteDto(n.Id, n.DossierId, n.QuestionCode, n.Text, n.CreatedAt))
            .ToListAsync(cancellationToken);

        return new DossierNoteListResult(MembershipAccess.Granted, notes);
    }

    public async Task<MembershipAccess> AddNoteAsync(Guid userId, bool isReviewer, Guid dossierId, string? questionCode, string text, CancellationToken cancellationToken)
    {
        // Notes are how a reviewer asks for more proof or explains a
        // decision back to the PME — reviewer/admin-only to post. A PME
        // responds by editing their answer/evidence directly.
        if (!isReviewer) return MembershipAccess.Forbidden;

        var dossierExists = await _db.Dossiers.AnyAsync(d => d.Id == dossierId, cancellationToken);
        if (!dossierExists) return MembershipAccess.NotFound;

        _db.DossierNotes.Add(new DossierNote
        {
            Id = Guid.NewGuid(),
            DossierId = dossierId,
            AuthorId = userId,
            QuestionCode = questionCode,
            Text = text,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
        return MembershipAccess.Granted;
    }

    public async Task<DossierAiContextResult> GetAiContextAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        if (!isReviewer) return new DossierAiContextResult(MembershipAccess.Forbidden, Array.Empty<DossierAnswerContext>());

        var dossier = await _db.Dossiers.FirstOrDefaultAsync(d => d.Id == dossierId, cancellationToken);
        if (dossier is null) return new DossierAiContextResult(MembershipAccess.NotFound, Array.Empty<DossierAnswerContext>());

        Dictionary<string, JsonElement> answers;
        try
        {
            answers = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(dossier.SnapshotJson) ?? new();
        }
        catch
        {
            answers = new();
        }

        var documents = await _db.Documents
            .Where(d => d.CompanyId == dossier.CompanyId)
            .ToListAsync(cancellationToken);
        var documentsByCode = documents.ToLookup(d => d.QuestionCode);

        var contexts = new List<DossierAnswerContext>();
        foreach (var (code, value) in answers)
        {
            var score = value.TryGetProperty("score", out var s) ? s.GetString() : null;
            if (string.IsNullOrEmpty(score)) continue;

            var note = value.TryGetProperty("note", out var n) ? n.GetString() : null;
            var document = documentsByCode[code].FirstOrDefault();
            var proofParts = new List<string>();
            if (!string.IsNullOrWhiteSpace(note)) proofParts.Add(note!);
            if (!string.IsNullOrWhiteSpace(document?.TextContent)) proofParts.Add(document!.TextContent!);
            if (!string.IsNullOrWhiteSpace(document?.FileName)) proofParts.Add($"Fichier joint : {document!.FileName}");

            contexts.Add(new DossierAnswerContext(code, QuestionCatalog.TitleFor(code), score, string.Join(" ", proofParts)));
        }

        return new DossierAiContextResult(MembershipAccess.Granted, contexts);
    }

    private async Task<MembershipAccess> CheckDossierAccessAsync(Guid userId, bool isReviewer, Guid dossierId, CancellationToken cancellationToken)
    {
        var dossier = await _db.Dossiers.FirstOrDefaultAsync(d => d.Id == dossierId, cancellationToken);
        if (dossier is null) return MembershipAccess.NotFound;
        if (isReviewer) return MembershipAccess.Granted;

        var membership = await FindMembershipAsync(userId, cancellationToken);
        return membership is not null && membership.CompanyId == dossier.CompanyId ? MembershipAccess.Granted : MembershipAccess.Forbidden;
    }

    private Task<CompanyUser?> FindMembershipAsync(Guid userId, CancellationToken cancellationToken) =>
        _db.CompanyUsers.FirstOrDefaultAsync(cu => cu.UserId == userId, cancellationToken);

    private async Task LogAsync(Guid actorId, Guid companyId, string action, CancellationToken cancellationToken)
    {
        // Best-effort: a failed audit write should never fail the real action.
        try
        {
            _db.AuditLogs.Add(new AuditLog { Id = Guid.NewGuid(), ActorId = actorId, CompanyId = companyId, Action = action, CreatedAt = DateTimeOffset.UtcNow });
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
        }
    }

    private static DossierDto ToDto(Dossier d) => new(
        d.Id,
        d.CompanyId,
        d.Company?.Name,
        d.Status.ToString(),
        d.DeclaredScore,
        d.ReviewedScore,
        d.FinalScore,
        d.SnapshotJson,
        d.SubmittedAt,
        d.ReviewedAt,
        d.UpdatedAt);
}

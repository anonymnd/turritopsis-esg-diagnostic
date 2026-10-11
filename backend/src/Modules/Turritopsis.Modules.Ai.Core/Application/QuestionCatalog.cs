namespace Turritopsis.Application.Ai;

// Mirrors frontend/src/features/questionnaire/questions.ts (code + title
// only — pillar/detail aren't needed server-side). Kept here so the
// dossier-wide AI review can build readable prompts without depending on
// the client to supply question metadata for every answer.
public static class QuestionCatalog
{
    public static readonly IReadOnlyDictionary<string, string> Titles = new Dictionary<string, string>
    {
        ["E1"] = "Gestion de l'energie",
        ["E2"] = "Gestion de l'eau",
        ["E3"] = "Gestion des dechets",
        ["E4"] = "Emissions de CO2",
        ["E5"] = "Produits chimiques",
        ["E6"] = "Biodiversite locale",
        ["E7"] = "Energies renouvelables",
        ["E8"] = "Conformite environnementale",
        ["E9"] = "Sensibilisation environnementale",
        ["S1"] = "Securite au travail",
        ["S2"] = "Conditions de travail",
        ["S3"] = "Remuneration equitable",
        ["S4"] = "Formation du personnel",
        ["S5"] = "Non-discrimination",
        ["S6"] = "Dialogue social",
        ["S7"] = "Sante des employes",
        ["S8"] = "Impact communautaire",
        ["S9"] = "Relations fournisseurs",
        ["G1"] = "Structure de gouvernance",
        ["G2"] = "Anti-corruption",
        ["G3"] = "Transparence financiere",
        ["G4"] = "Conformite fiscale",
        ["G5"] = "Gestion des risques",
        ["G6"] = "Protection des donnees",
        ["G7"] = "Ethique des affaires",
        ["G8"] = "Droits des parties prenantes",
        ["G9"] = "Audit interne"
    };

    public static string TitleFor(string code) => Titles.TryGetValue(code, out var title) ? title : code;
}

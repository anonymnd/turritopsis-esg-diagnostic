import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCompany } from "../../../features/company/useCompany";
import { updateCompanyProfile } from "../../../features/company/api";
import styles from "./company-info.module.css";

const EMPLOYEE_RANGES = ["1-9", "10-49", "50-99", "100-249", "250+"];

export default function CompanyInfoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: company, isPending } = useCompany();

  const [city, setCity] = useState("");
  const [ice, setIce] = useState("");
  const [employeeRange, setEmployeeRange] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (company && !hydrated) {
      setCity(company.city ?? "");
      setIce(company.ice ?? "");
      setEmployeeRange(company.employeeRange ?? "");
      setWebsite(company.website ?? "");
      setPhone(company.phone ?? "");
      setActivityDescription(company.activityDescription ?? "");
      setHydrated(true);
    }
  }, [company, hydrated]);

  const mutation = useMutation({
    mutationFn: () => updateCompanyProfile({ city, ice, employeeRange, website, phone, activityDescription }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["company", "mine"], updated);
      const redirectTo = searchParams.get("next");
      if (redirectTo) navigate(redirectTo);
    }
  });

  if (isPending || !company) {
    return (
      <div className={styles.wrap}>
        <p>Chargement…</p>
      </div>
    );
  }

  const wasIncomplete = !company.isProfileComplete;

  return (
    <div className={styles.wrap}>
      <h2>Infos entreprise</h2>
      <p className={styles.subtitle}>
        {wasIncomplete
          ? "Completez ces informations pour constituer un dossier complet avant de commencer le questionnaire."
          : "Ces informations apparaissent dans votre dossier ESG et aident le reviseur a situer votre entreprise."}
      </p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <div className={styles.field}>
          <label htmlFor="city">Ville</label>
          <input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca" />
        </div>

        <div className={styles.field}>
          <label htmlFor="ice">ICE (Identifiant Commun de l'Entreprise)</label>
          <input id="ice" value={ice} onChange={(e) => setIce(e.target.value)} placeholder="001234567000012" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="employeeRange">Nombre d'employes</label>
          <select id="employeeRange" value={employeeRange} onChange={(e) => setEmployeeRange(e.target.value)} required>
            <option value="" disabled>
              Selectionnez une tranche
            </option>
            {EMPLOYEE_RANGES.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="phone">Telephone</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6 00 00 00 00" required />
        </div>

        <div className={styles.field}>
          <label htmlFor="website">Site web (optionnel)</label>
          <input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://votre-entreprise.ma" />
        </div>

        <div className={styles.field}>
          <label htmlFor="activityDescription">Description de l'activite</label>
          <textarea
            id="activityDescription"
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            placeholder="Decrivez brievement l'activite principale de l'entreprise…"
            rows={4}
            required
          />
        </div>

        <button type="submit" className={styles.submit} disabled={mutation.isPending}>
          {mutation.isPending ? "Un instant…" : "Enregistrer"}
        </button>
        {mutation.isSuccess && !searchParams.get("next") && <p className={styles.confirmation}>Informations enregistrees.</p>}
      </form>
    </div>
  );
}

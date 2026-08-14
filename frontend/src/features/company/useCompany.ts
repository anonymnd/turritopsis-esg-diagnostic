import { useQuery } from "@tanstack/react-query";
import { getMyCompany } from "./api";

export function useCompany() {
  return useQuery({ queryKey: ["company", "mine"], queryFn: getMyCompany });
}

// src/types/contract.ts
export type ClauseBlock =
  | { type: "text"; content: string }
  | { type: "list"; items: string[] };

export type Clause = {
  id: string;
  title?: string;
  blocks: ClauseBlock[];
};

export type SignatureInfo = {
  id: string;
  role: string;
  name?: string;
  position?: string;
  image?: string;
  inlineName?: boolean;
};

export type ContractConfig = {
  title: string;
  date: string;
  partyA: { company: string; taxId?: string };
  partyB: { company: string; taxId?: string; address?: string };
  clauses: Clause[];
  stamp?: string | null;
  signatures: SignatureInfo[];
};

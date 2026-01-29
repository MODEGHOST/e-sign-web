// src/types/contract.ts

// รองรับ block หลายแบบในข้อสัญญา
export type ClauseBlock =
  | {
      type: "text";
      content: string;
    }
  | {
      type: "list";
      items: string[];
    };

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

export type ContractParty = {
  company: string;
  taxId?: string;
  buildNo?: string;
};

export type ContractConfig = {
  title: string;
  date: string;

  partyA: ContractParty;
  partyB: ContractParty;

  clauses: Clause[];

  stamp?: string | null;
  signatures: SignatureInfo[];
};

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
  name: string;
  position: string;
};

export type ContractConfig = {
  title: string;
  date: string;
  partyA: {
    company: string;
    taxId?: string;
  };
  partyB: {
    company: string;
    taxId?: string;
  };
  clauses: Clause[];

  stamp?: string | null;
  signatures: SignatureInfo[];
};


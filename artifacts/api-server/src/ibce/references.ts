// Verified bibliographic references for IBCE v1.0
// All citations manually verified - DO NOT add unverified references

export interface IbceRef {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  doi: string;
  pmid: string | null;
  url: string;
}

export const IBCE_REFERENCES: IbceRef[] = [
  {
    id: "uhlen2015",
    authors: "Uhlen M, Fagerberg L, Hallstrom BM, et al.",
    year: 2015,
    title: "Proteomics. Tissue-based map of the human proteome.",
    journal: "Science",
    doi: "10.1126/science.1260419",
    pmid: "25613900",
    url: "https://doi.org/10.1126/science.1260419",
  },
  {
    id: "thul2018",
    authors: "Thul PJ, Lindskog C.",
    year: 2018,
    title: "The human protein atlas: A spatial map of the human proteome.",
    journal: "Protein Science",
    doi: "10.1002/pro.3307",
    pmid: "28940875",
    url: "https://doi.org/10.1002/pro.3307",
  },
  {
    id: "bray2024",
    authors: "Bray F, Laversanne M, Sung H, et al.",
    year: 2024,
    title: "Global cancer statistics 2022.",
    journal: "CA: A Cancer Journal for Clinicians",
    doi: "10.3322/caac.21834",
    pmid: "38572751",
    url: "https://doi.org/10.3322/caac.21834",
  },
  {
    id: "perou2000",
    authors: "Perou CM, Sorlie T, Eisen MB, et al.",
    year: 2000,
    title: "Molecular portraits of human breast tumours.",
    journal: "Nature",
    doi: "10.1038/35021093",
    pmid: "10963602",
    url: "https://doi.org/10.1038/35021093",
  },
  {
    id: "tcganetwork2012",
    authors: "Cancer Genome Atlas Network.",
    year: 2012,
    title: "Comprehensive molecular portraits of human breast tumours.",
    journal: "Nature",
    doi: "10.1038/nature11412",
    pmid: "23000897",
    url: "https://doi.org/10.1038/nature11412",
  },
];

function formatHarvard(ref: IbceRef): string {
  return `${ref.authors} (${ref.year}) ${ref.title} ${ref.journal}. doi:${ref.doi}`;
}

function formatApa(ref: IbceRef): string {
  return `${ref.authors} (${ref.year}). ${ref.title} ${ref.journal}. https://doi.org/${ref.doi}`;
}

function formatVancouver(ref: IbceRef): string {
  return `${ref.authors} ${ref.title} ${ref.journal}. ${ref.year}. doi:${ref.doi}`;
}

export function formatReference(ref: IbceRef, style: "harvard" | "apa" | "vancouver" = "harvard"): string {
  switch (style) {
    case "apa": return formatApa(ref);
    case "vancouver": return formatVancouver(ref);
    default: return formatHarvard(ref);
  }
}

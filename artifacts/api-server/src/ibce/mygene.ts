// MyGene.info API client for gene annotation

const MYGENE_BASE = "https://mygene.info/v3";

export interface AnnotationItem {
  id: string | null;
  name: string;
  url: string | null;
  source: "KEGG" | "Reactome" | "GO:BP" | "GO:MF" | "GO:CC";
}

export interface MyGeneHit {
  _id: string;
  symbol?: string;
  name?: string;
  ensembl?: { gene?: string } | Array<{ gene?: string }>;
  genomic_pos_hg19?: { chr?: string; start?: number; end?: number };
  genomic_pos?: { chr?: string } | Array<{ chr?: string }>;
  summary?: string;
  uniprot?: { "Swiss-Prot"?: string | string[] } | string;
  entrezgene?: string | number;
  go?: {
    BP?: Array<{ id: string; term: string; evidence?: string }>;
    MF?: Array<{ id: string; term: string; evidence?: string }>;
    CC?: Array<{ id: string; term: string; evidence?: string }>;
  };
  pathway?: {
    kegg?: Array<{ id: string; name: string }> | { id: string; name: string };
    reactome?: Array<{ id: string; name: string }> | { id: string; name: string };
  };
  MIM?: Array<{ description: string }>;
}

export interface MyGeneAnnotation {
  symbol: string;
  name: string;
  ensemblId: string | null;
  uniprotId: string | null;
  ncbiGeneId: string | null;
  chromosome: string | null;
  summary: string | null;
  biologicalProcesses: AnnotationItem[];
  molecularFunctions: AnnotationItem[];
  cellularComponents: AnnotationItem[];
  pathways: AnnotationItem[];
  diseases: string[];
}

async function mygeneGet<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${MYGENE_BASE}${endpoint}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

function normalizeArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeAnnotationItems(items: AnnotationItem[]): AnnotationItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchMygene(q: string, limit = 10): Promise<Array<{ ensemblId: string; symbol: string; name: string; chromosome: string | null }>> {
  const url = `/query?q=${encodeURIComponent(q)}&fields=symbol,name,ensembl.gene,genomic_pos&species=human&size=${limit}`;
  const data = await mygeneGet<{ hits?: MyGeneHit[] }>(url);
  if (!data?.hits) return [];

  return data.hits
    .map((h) => {
      const ensemblRaw = h.ensembl;
      let ensemblId: string | null = null;
      if (Array.isArray(ensemblRaw)) {
        ensemblId = ensemblRaw[0]?.gene ?? null;
      } else if (ensemblRaw && typeof ensemblRaw === "object") {
        ensemblId = ensemblRaw.gene ?? null;
      }
      const chrRaw = h.genomic_pos;
      const chrObj = Array.isArray(chrRaw) ? chrRaw[0] : chrRaw;
      const chr = chrObj?.chr ?? null;
      return {
        ensemblId: ensemblId ?? h._id,
        symbol: h.symbol ?? h._id,
        name: h.name ?? "",
        chromosome: chr ? `chr${chr}` : null,
      };
    })
    .filter((h) => h.symbol && h.name);
}

export async function annotateGene(geneId: string): Promise<MyGeneAnnotation | null> {
  const isEnsg = geneId.toUpperCase().startsWith("ENSG");
  const fields = "symbol,name,ensembl.gene,uniprot,entrezgene,summary,genomic_pos,go.BP,go.MF,go.CC,pathway.kegg,pathway.reactome,MIM";
  const url = isEnsg
    ? `/query?q=ensembl.gene:${geneId}&fields=${fields}&species=human&size=1`
    : `/query?q=symbol:${geneId}&fields=${fields}&species=human&size=1`;

  const data = await mygeneGet<{ hits?: MyGeneHit[] }>(url);
  const hit = data?.hits?.[0];
  if (!hit) return null;

  // Ensembl ID
  const ensemblRaw = hit.ensembl;
  let ensemblId: string | null = null;
  if (Array.isArray(ensemblRaw)) {
    ensemblId = ensemblRaw[0]?.gene ?? null;
  } else if (ensemblRaw && typeof ensemblRaw === "object") {
    ensemblId = ensemblRaw.gene ?? null;
  }

  // UniProt
  let uniprotId: string | null = null;
  const uniprotRaw = hit.uniprot;
  if (uniprotRaw && typeof uniprotRaw === "object") {
    const sp = (uniprotRaw as { "Swiss-Prot"?: string | string[] })["Swiss-Prot"];
    if (Array.isArray(sp)) uniprotId = sp[0] ?? null;
    else uniprotId = sp ?? null;
  }

  // Chromosome
  const chrRaw = hit.genomic_pos;
  const chrObj = Array.isArray(chrRaw) ? chrRaw[0] : chrRaw;
  const chr = chrObj?.chr ?? null;

  // GO Biological Processes - with IDs
  const goRaw = hit.go;
  const bpRaw = normalizeArray(goRaw?.BP);
  const mfRaw = normalizeArray(goRaw?.MF);
  const ccRaw = normalizeArray(goRaw?.CC);

  const bp: AnnotationItem[] = dedupeAnnotationItems(
    bpRaw.map((g) => ({
      id: g.id ?? null,
      name: g.term,
      url: g.id ? `https://www.ebi.ac.uk/QuickGO/term/${g.id}` : null,
      source: "GO:BP" as const,
    }))
  ).slice(0, 10);

  const mf: AnnotationItem[] = dedupeAnnotationItems(
    mfRaw.map((g) => ({
      id: g.id ?? null,
      name: g.term,
      url: g.id ? `https://www.ebi.ac.uk/QuickGO/term/${g.id}` : null,
      source: "GO:MF" as const,
    }))
  ).slice(0, 8);

  const cc: AnnotationItem[] = dedupeAnnotationItems(
    ccRaw.map((g) => ({
      id: g.id ?? null,
      name: g.term,
      url: g.id ? `https://www.ebi.ac.uk/QuickGO/term/${g.id}` : null,
      source: "GO:CC" as const,
    }))
  ).slice(0, 10);

  // Pathways - KEGG with IDs
  const keggRaw = normalizeArray(hit.pathway?.kegg);
  const keggItems: AnnotationItem[] = dedupeByName(keggRaw).slice(0, 6).map((p) => ({
    id: p.id ?? null,
    name: p.name.replace(/ - Homo sapiens \(human\)$/, ""),
    url: p.id ? `https://www.kegg.jp/pathway/${p.id}` : null,
    source: "KEGG" as const,
  }));

  // Reactome with IDs
  const reactomeRaw = normalizeArray(hit.pathway?.reactome);
  const reactomeItems: AnnotationItem[] = dedupeByName(reactomeRaw).slice(0, 4).map((p) => ({
    id: p.id ?? null,
    name: p.name,
    url: p.id ? `https://reactome.org/content/detail/${p.id}` : null,
    source: "Reactome" as unknown as "KEGG",
  }));

  const pathways = [...keggItems, ...reactomeItems].slice(0, 10) as AnnotationItem[];

  const diseases = Array.isArray(hit.MIM) ? hit.MIM.slice(0, 5).map((d) => d.description) : [];

  return {
    symbol: hit.symbol ?? geneId,
    name: hit.name ?? "",
    ensemblId,
    uniprotId,
    ncbiGeneId: hit.entrezgene ? String(hit.entrezgene) : null,
    chromosome: chr ? `chr${chr}` : null,
    summary: hit.summary ?? null,
    biologicalProcesses: bp,
    molecularFunctions: mf,
    cellularComponents: cc,
    pathways,
    diseases,
  };
}

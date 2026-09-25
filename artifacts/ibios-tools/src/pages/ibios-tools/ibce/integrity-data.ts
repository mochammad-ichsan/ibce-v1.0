export interface BilingualText {
  en: string;
  id: string;
}

export type IntegrityResourceKind = 'method' | 'software' | 'acknowledgement';

export interface IntegrityResource {
  kind: IntegrityResourceKind;
  title: BilingualText;
  description: BilingualText;
  evidence: BilingualText;
  usedIn: BilingualText;
  citationIds?: string[];
  href?: string;
}

export interface IntegrityCitation {
  id: string;
  kind: 'publication' | 'method' | 'software' | 'manuscript';
  authors: string;
  year: string;
  title: string;
  venue: string;
  url: string;
}

export const INTEGRITY_RESOURCES: IntegrityResource[] = [
  {
    kind: 'method',
    title: { en: 'Kaplan-Meier estimator', id: 'Estimator Kaplan-Meier' },
    description: {
      en: 'The browser derives Kaplan-Meier steps from the high- and low-expression survival records returned by the IBCE API, using observed events and censoring.',
      id: 'Browser menghitung tahapan Kaplan-Meier dari rekaman kelangsungan hidup kelompok ekspresi tinggi dan rendah yang dikembalikan API IBCE, dengan memperhatikan kejadian dan sensor.',
    },
    evidence: {
      en: 'Formula: S-hat(t) = product of (1 - d-i / n-i), where d-i is the event count and n-i is the number at risk.',
      id: 'Persamaan: S-hat(t) = hasil kali (1 - d-i / n-i), dengan d-i sebagai jumlah kejadian dan n-i sebagai jumlah yang berisiko.',
    },
    usedIn: { en: 'TCGA-BRCA survival curve; separate from imported HPA prognosis classifications', id: 'Kurva kelangsungan hidup TCGA-BRCA; terpisah dari klasifikasi prognosis HPA yang diimpor' },
    citationIds: ['kaplan-meier-1958'],
  },
  {
    kind: 'method',
    title: { en: 'Log-rank comparison', id: 'Perbandingan log-rank' },
    description: {
      en: 'The API compares two TCGA-BRCA overall-survival groups using the Mantel-Cox statistic and a chi-square one-degree-of-freedom approximation. It withholds the p-value unless each group has at least five observed deaths.',
      id: 'API membandingkan dua kelompok kesintasan keseluruhan TCGA-BRCA dengan statistik Mantel-Cox dan aproksimasi chi-square satu derajat kebebasan. Nilai p tidak ditampilkan kecuali setiap kelompok memiliki sedikitnya lima kematian yang teramati.',
    },
    evidence: {
      en: 'The unadjusted, exploratory p-value is a cohort-level comparison. It is not adjusted for confounders or multiple gene searches and is not an individual risk estimate or a causal claim.',
      id: 'Nilai p eksploratoris tanpa penyesuaian membandingkan kohort. Nilai ini tidak disesuaikan untuk perancu atau pengujian banyak gen serta bukan perkiraan risiko individu maupun klaim sebab akibat.',
    },
    usedIn: { en: 'High versus low patient RNA survival comparison', id: 'Perbandingan kelangsungan hidup RNA pasien berekspresi tinggi dan rendah' },
    citationIds: ['mantel-1966'],
  },
  {
    kind: 'method',
    title: { en: 'Expression grouping and ranking', id: 'Pengelompokan dan peringkat ekspresi' },
    description: {
      en: 'RNA views retain source units (nTPM or pTPM). Survival uses one eligible primary-tumor expression value per clinical case, the arithmetic sample median of the analyzed cases (average of the two middle values when even), and assigns values at or above it to high. Ties can make groups unequal.',
      id: 'Tampilan RNA mempertahankan satuan sumber (nTPM atau pTPM). Analisis kesintasan memakai satu nilai ekspresi tumor primer yang memenuhi syarat per kasus klinis, median sampel aritmetis dari kasus yang dianalisis (rata-rata dua nilai tengah jika genap), dan menempatkan nilai pada atau di atas median dalam kelompok tinggi. Nilai seri dapat membuat kelompok tidak seimbang.',
    },
    evidence: {
      en: 'The median split is a display convention for high and low expression, not a validated diagnostic threshold.',
      id: 'Pemisahan median adalah konvensi tampilan untuk ekspresi tinggi dan rendah, bukan ambang diagnostik tervalidasi.',
    },
    usedIn: { en: 'Cell-line RNA, patient RNA, and prognosis panels', id: 'Panel RNA lini sel, RNA pasien, dan prognosis' },
    citationIds: ['uhlen-2015', 'tcga-2012'],
  },
  {
    kind: 'method',
    title: { en: 'Source ingest and breast-cancer selection', id: 'Ingest sumber dan seleksi kanker payudara' },
    description: {
      en: 'IBCE normalizes six reference layers: HPA IHC, HPA prognosis, HPA cell-line metadata, HPA cell-line RNA, HPA cancer-sample RNA, and TCGA-BRCA clinical records. Local HPA archives are filtered to breast cancer; patient RNA is fetched from HPA. TCGA clinical and follow-up records are merged by case.',
      id: 'IBCE menormalisasi enam lapisan referensi: IHC HPA, prognosis HPA, metadata lini sel HPA, RNA lini sel HPA, RNA sampel kanker HPA, dan rekaman klinis TCGA-BRCA. Arsip HPA lokal disaring untuk kanker payudara; RNA pasien diambil dari HPA. Rekaman klinis dan tindak lanjut TCGA digabung menurut kasus.',
    },
    evidence: {
      en: 'The live Data Sources registry reports ingested rows; the Download Center lists normalized exports and available original-file hashes. A source-file checksum is not a checksum of the normalized export.',
      id: 'Registri Sumber Data langsung melaporkan baris yang diingest; Pusat Unduhan mencantumkan ekspor ternormalisasi dan hash berkas sumber yang tersedia. Checksum berkas sumber bukan checksum ekspor ternormalisasi.',
    },
    usedIn: { en: 'Data Sources, gene dossier, cell-line directory, and normalized exports', id: 'Sumber Data, dossier gen, direktori lini sel, dan ekspor ternormalisasi' },
    citationIds: ['uhlen-2015', 'tcga-2012', 'gdc-portal'],
  },
  {
    kind: 'method',
    title: { en: 'HPA prognosis classification versus IBCE survival', id: 'Klasifikasi prognosis HPA versus survival IBCE' },
    description: {
      en: 'HPA prognosis labels are imported separately from IBCE survival. For survival, only TCGA sample-type 01 (primary solid tumor) with finite nonnegative pTPM is eligible. IBCE matches the first 12 barcode characters to a clinical case, collapses identical duplicate values, and excludes discordant duplicate values. Only Alive with positive days to last follow-up (censored) or Dead with positive days to death (event) enter the overall-survival analysis. At least 10 analyzed cases and five per expression group are required.',
      id: 'Label prognosis HPA diimpor terpisah dari analisis kesintasan IBCE. Hanya sampel TCGA tipe 01 (tumor padat primer) dengan pTPM terukur, terbatas, dan tidak negatif yang memenuhi syarat. IBCE mencocokkan 12 karakter awal barcode dengan kasus klinis, menyatukan nilai duplikat identik, dan mengecualikan nilai duplikat yang bertentangan. Hanya status Alive dengan hari tindak lanjut positif (tersensor) atau Dead dengan hari hingga kematian positif (kejadian) yang masuk analisis kesintasan keseluruhan. Diperlukan minimal 10 kasus dianalisis dan lima kasus per kelompok ekspresi.',
    },
    evidence: {
      en: 'An HPA prognosis category and an exploratory IBCE log-rank result are different evidence products; neither establishes individual prognosis or causation. Exported normalized RNA and clinical tables contain more records than the filtered survival cohort.',
      id: 'Kategori prognosis HPA dan hasil log-rank eksploratoris IBCE adalah produk bukti berbeda; keduanya tidak menetapkan prognosis individu maupun sebab akibat. Tabel RNA dan klinis ternormalisasi yang diekspor memuat lebih banyak rekaman daripada kohort kesintasan yang telah disaring.',
    },
    usedIn: { en: 'Prognostic associations and TCGA-BRCA Kaplan-Meier panel', id: 'Asosiasi prognostik dan panel Kaplan-Meier TCGA-BRCA' },
    citationIds: ['uhlen-2015', 'tcga-2012', 'kaplan-meier-1958', 'mantel-1966'],
  },
  {
    kind: 'method',
    title: { en: 'Cell-line identity and conflicting RNA rows', id: 'Identitas lini sel dan baris RNA yang bertentangan' },
    description: {
      en: 'The bundled Cellosaurus snapshot enriches breast cell-line metadata via exact CVCL identifier, with a name match only when no identifier exists. Identical duplicate RNA observations collapse in a dossier; conflicting values are flagged as discordant rather than averaged or chosen.',
      id: 'Snapshot Cellosaurus yang disertakan memperkaya metadata lini sel payudara melalui pengenal CVCL yang sama persis, dengan pencocokan nama hanya jika pengenal tidak tersedia. Observasi RNA duplikat yang identik disatukan di dossier; nilai yang bertentangan ditandai discordant, bukan dirata-ratakan atau dipilih sembarang.',
    },
    evidence: {
      en: 'The snapshot is bundled, not queried as a live Cellosaurus API. Missing receptor or subtype fields must not be inferred from names or other fields.',
      id: 'Snapshot disertakan bersama aplikasi, bukan dikueri melalui API Cellosaurus langsung. Status reseptor atau subtipe yang kosong tidak boleh disimpulkan dari nama atau kolom lain.',
    },
    usedIn: { en: 'Cell Line Directory and cell-line RNA dossier', id: 'Direktori Lini Sel dan dossier RNA lini sel' },
    citationIds: ['cellosaurus'],
  },
  {
    kind: 'method',
    title: { en: 'Gene comparison and visualization', id: 'Perbandingan gen dan visualisasi' },
    description: {
      en: 'Optional comparison loads a second gene dossier. RNA charts distinguish the primary and comparison gene, and show shared samples or cell lines where a direct comparison is available. Sorting and Top N affect the display, not the underlying measured units.',
      id: 'Perbandingan opsional memuat dossier gen kedua. Grafik RNA membedakan gen utama dan pembanding serta menampilkan sampel atau lini sel bersama bila perbandingan langsung tersedia. Pengurutan dan N teratas memengaruhi tampilan, bukan satuan pengukuran dasarnya.',
    },
    evidence: {
      en: 'When either gene or shared observations are unavailable, the panel says so rather than inventing a comparison. Chart colors do not represent significance or clinical risk.',
      id: 'Jika salah satu gen atau observasi bersama tidak tersedia, panel menyatakannya alih-alih mengarang perbandingan. Warna grafik tidak menunjukkan signifikansi atau risiko klinis.',
    },
    usedIn: { en: 'Gene dossier comparison, RNA panels, and chart export', id: 'Perbandingan dossier gen, panel RNA, dan ekspor grafik' },
  },
  {
    kind: 'method',
    title: { en: 'Evidence-layer crosswalk', id: 'Pemetaan silang lapisan bukti' },
    description: {
      en: 'Gene symbols are linked to Ensembl, NCBI Gene, UniProt, Open Targets, IHC, prognosis, cell-line RNA, and patient RNA records when available.',
      id: 'Simbol gen dipetakan ke rekaman Ensembl, NCBI Gene, UniProt, Open Targets, IHC, prognosis, RNA lini sel, dan RNA pasien bila tersedia.',
    },
    evidence: {
      en: 'Identifiers, database names, sample IDs, cell-line names, and source units remain unchanged for auditability.',
      id: 'Pengenal, nama basis data, ID sampel, nama lini sel, dan satuan sumber dipertahankan untuk auditabilitas.',
    },
    usedIn: { en: 'Gene dossier identity links and functional annotation', id: 'Tautan identitas dossier gen dan anotasi fungsional' },
    citationIds: ['cunningham-2022', 'uniprot-2023', 'open-targets-2021'],
  },
  {
    kind: 'method',
    title: { en: 'MyGene.info annotation aggregation', id: 'Agregasi anotasi MyGene.info' },
    description: {
      en: 'IBCE queries MyGene.info to retrieve gene descriptions and structured GO, KEGG, and Reactome annotations while retaining source identifiers.',
      id: 'IBCE mengueri MyGene.info untuk mengambil deskripsi gen serta anotasi GO, KEGG, dan Reactome terstruktur sambil mempertahankan pengenal sumber.',
    },
    evidence: {
      en: 'MyGene.info aggregates external annotations. A returned annotation is reference knowledge and not a measurement from the displayed tumor sample.',
      id: 'MyGene.info mengagregasi anotasi eksternal. Anotasi yang dikembalikan adalah pengetahuan referensi dan bukan pengukuran dari sampel tumor yang ditampilkan.',
    },
    usedIn: { en: 'Gene summaries and functional annotation panels', id: 'Ringkasan gen dan panel anotasi fungsional' },
    citationIds: ['xin-2016', 'go-2021', 'kegg-2021', 'reactome-2022'],
  },
  {
    kind: 'method',
    title: { en: 'AI-assisted interpretation and its limits', id: 'Interpretasi berbantuan AI dan batasannya' },
    description: {
      en: 'The interpretation endpoint sends a constrained summary of an evidence panel to an OpenAI-compatible service via Replit AI Integrations (currently model gpt-5.6-terra). It requests bilingual, structured observations and caveats; it does not generate measurements or perform the survival calculation.',
      id: 'Endpoint interpretasi mengirim ringkasan panel bukti yang dibatasi ke layanan kompatibel OpenAI melalui Replit AI Integrations (saat ini model gpt-5.6-terra). Layanan diminta menyusun observasi dan batasan secara terstruktur dalam dua bahasa; layanan tidak menghasilkan pengukuran atau menghitung survival.',
    },
    evidence: {
      en: 'The API validates inputs and outputs, rejects patient/sample identifiers, rate-limits and caches requests, and shows an unavailable state if the service fails. Model prose is not a citation, independent validation, diagnosis, or therapeutic advice.',
      id: 'API memvalidasi masukan dan keluaran, menolak pengenal pasien/sampel, membatasi laju serta menyimpan cache permintaan, dan menampilkan status tidak tersedia jika layanan gagal. Uraian model bukan sitasi, validasi independen, diagnosis, atau saran terapi.',
    },
    usedIn: { en: 'Optional evidence-panel interpretation in the gene dossier', id: 'Interpretasi opsional panel bukti pada dossier gen' },
    citationIds: ['openai-api', 'replit'],
  },
  {
    kind: 'method',
    title: { en: 'Export provenance and SHA-256 verification', id: 'Asal ekspor dan verifikasi SHA-256' },
    description: {
      en: 'Normalized CSV exports are streamed in a fixed column and row order from read-only PostgreSQL snapshots. A ZIP bundles six CSVs, a README, and a manifest. The server hashes the exact response bytes and records completed or failed attempts in export history.',
      id: 'Ekspor CSV ternormalisasi dialirkan dengan urutan kolom dan baris tetap dari snapshot PostgreSQL hanya-baca. ZIP mengemas enam CSV, README, dan manifes. Server menghitung hash dari bita respons yang tepat serta mencatat percobaan selesai atau gagal dalam riwayat ekspor.',
    },
    evidence: {
      en: 'Compare a locally computed SHA-256 with the full digest in export history. The ZIP-internal manifest cannot contain the final ZIP checksum; source-file hashes and panel PNG/XLSX exports have different scopes.',
      id: 'Bandingkan SHA-256 yang dihitung secara lokal dengan hash lengkap dalam riwayat ekspor. Manifes di dalam ZIP tidak dapat memuat checksum akhir ZIP; hash berkas sumber dan ekspor PNG/XLSX panel memiliki cakupan berbeda.',
    },
    usedIn: { en: 'Download Center, normalized dataset CSVs, ZIP package, and export history', id: 'Pusat Unduhan, CSV dataset ternormalisasi, paket ZIP, dan riwayat ekspor' },
    citationIds: ['postgresql-docs'],
  },
  {
    kind: 'method',
    title: { en: 'Missing-data disclosure', id: 'Pengungkapan data yang hilang' },
    description: {
      en: 'Empty, partial, unavailable, and non-shared evidence states are rendered explicitly instead of being replaced by inferred values.',
      id: 'Keadaan bukti kosong, parsial, tidak tersedia, dan tidak sama ditampilkan secara eksplisit, bukan diganti dengan nilai perkiraan.',
    },
    evidence: {
      en: 'A missing record is not treated as evidence that a biological feature is absent.',
      id: 'Rekaman yang hilang tidak diperlakukan sebagai bukti bahwa fitur biologis tidak ada.',
    },
    usedIn: { en: 'Every dossier evidence panel', id: 'Setiap panel bukti dossier' },
  },
  {
    kind: 'software',
    title: { en: 'React, TypeScript, and Vite', id: 'React, TypeScript, dan Vite' },
    description: {
      en: 'The IBCE interface is a React and TypeScript application built and served with Vite in the ibios-tools artifact.',
      id: 'Antarmuka IBCE adalah aplikasi React dan TypeScript yang dibangun serta dijalankan dengan Vite di artifact ibios-tools.',
    },
    evidence: {
      en: 'Verified in the ibios-tools package scripts and the configured web workflow.',
      id: 'Diverifikasi melalui script package ibios-tools dan workflow web yang dikonfigurasi.',
    },
    usedIn: { en: 'IBCE web interface, routing, and production build', id: 'Antarmuka web, routing, dan build produksi IBCE' },
    citationIds: ['react-docs', 'typescript-docs', 'vite-docs'],
  },
  {
    kind: 'software',
    title: { en: 'Recharts and SVG rendering', id: 'Recharts dan rendering SVG' },
    description: {
      en: 'Interactive RNA and survival plots use Recharts; the IHC distribution panel uses an accessible SVG donut where panel clipping requires it.',
      id: 'Plot RNA dan kelangsungan hidup interaktif menggunakan Recharts; panel distribusi IHC menggunakan donut SVG yang aksesibel ketika clipping panel memerlukannya.',
    },
    evidence: {
      en: 'Chart colors, legends, tooltips, and data labels are kept distinct from scientific meaning.',
      id: 'Warna grafik, legenda, tooltip, dan label data dipisahkan dari makna ilmiah.',
    },
    usedIn: { en: 'RNA charts, survival curves, and IHC distribution', id: 'Grafik RNA, kurva kelangsungan hidup, dan distribusi IHC' },
    citationIds: ['recharts-docs'],
  },
  {
    kind: 'software',
    title: { en: 'Node.js, Express, PostgreSQL, and Drizzle', id: 'Node.js, Express, PostgreSQL, dan Drizzle' },
    description: {
      en: 'The API server exposes IBCE routes, stores ingested reference layers in PostgreSQL, and uses Drizzle ORM for database access.',
      id: 'API server menyediakan route IBCE, menyimpan lapisan referensi yang di-ingest di PostgreSQL, dan menggunakan Drizzle ORM untuk akses basis data.',
    },
    evidence: {
      en: 'Verified in the API server package, IBCE routes, schema imports, and the API workflow.',
      id: 'Diverifikasi melalui package API server, route IBCE, import schema, dan workflow API.',
    },
    usedIn: { en: 'IBCE API routes, persistence, and query layer', id: 'Route API, persistensi, dan lapisan kueri IBCE' },
    citationIds: ['node-docs', 'express-docs', 'postgresql-docs', 'drizzle-docs'],
  },
  {
    kind: 'software',
    title: { en: 'CSV, TSV, XLSX, and PNG export', id: 'Ekspor CSV, TSV, XLSX, dan PNG' },
    description: {
      en: 'Researchers can export complete panel rows as CSV, TSV, or XLSX and export the visible figure as a PNG.',
      id: 'Peneliti dapat mengekspor seluruh baris panel sebagai CSV, TSV, atau XLSX dan mengekspor gambar yang terlihat sebagai PNG.',
    },
    evidence: {
      en: 'Exports preserve source values and current view state; they do not add statistical validation or clinical meaning.',
      id: 'Ekspor mempertahankan nilai sumber dan keadaan tampilan saat ini; ekspor tidak menambahkan validasi statistik atau makna klinis.',
    },
    usedIn: { en: 'Panel data downloads and publication-ready figure export', id: 'Unduhan data panel dan ekspor gambar siap publikasi' },
    citationIds: ['sheetjs-docs', 'html-to-image'],
  },
  {
    kind: 'software',
    title: { en: 'Replit execution and preview workflow', id: 'Eksekusi dan workflow preview Replit' },
    description: {
      en: 'Replit runs the web artifact with pnpm and Vite, runs the API artifact with Node.js and its build/start scripts, and exposes the mounted preview routes.',
      id: 'Replit menjalankan web artifact dengan pnpm dan Vite, menjalankan API artifact dengan Node.js serta script build/start, dan menyediakan route preview yang terpasang.',
    },
    evidence: {
      en: 'This is a project execution acknowledgement verified from the configured artifact workflows, not a scientific data source.',
      id: 'Ini adalah acknowledgement eksekusi proyek yang diverifikasi dari workflow artifact, bukan sumber data ilmiah.',
    },
    usedIn: { en: 'Development workspace, artifact workflows, and preview routing', id: 'Workspace pengembangan, workflow artifact, dan routing preview' },
    citationIds: ['replit'],
  },
  {
    kind: 'software',
    title: { en: 'Playwright browser verification', id: 'Verifikasi browser Playwright' },
    description: {
      en: 'Responsive flows, bilingual switching, chart themes, tooltips, and no-overflow behavior are checked in a real browser.',
      id: 'Alur responsif, pergantian bilingual, tema grafik, tooltip, dan perilaku tanpa overflow diperiksa di browser nyata.',
    },
    evidence: {
      en: 'Browser verification is a quality-control activity, not evidence for a biological conclusion.',
      id: 'Verifikasi browser adalah aktivitas kendali mutu, bukan bukti untuk kesimpulan biologis.',
    },
    usedIn: { en: 'Bilingual, theme, navigation, and responsive regression checks', id: 'Pemeriksaan regresi bilingual, tema, navigasi, dan responsif' },
    citationIds: ['playwright-docs'],
  },
  {
    kind: 'acknowledgement',
    title: { en: 'ChatGPT Plus for ideation support', id: 'ChatGPT Plus untuk dukungan ideasi' },
    description: {
      en: 'ChatGPT Plus was used for brainstorming and early architecture exploration during development, with human review of implementation and scientific claims.',
      id: 'ChatGPT Plus digunakan untuk brainstorming dan eksplorasi arsitektur awal selama pengembangan, dengan tinjauan manusia atas implementasi dan klaim ilmiah.',
    },
    evidence: {
      en: 'Development acknowledgement as recorded by the project team, not independently established from runtime code; not a source for measurements, annotations, or biological conclusions.',
      id: 'Pengakuan kontribusi pengembangan sebagaimana dicatat tim proyek, bukan bukti yang dapat diverifikasi dari kode saat aplikasi berjalan; bukan sumber pengukuran, anotasi, atau kesimpulan biologis.',
    },
    usedIn: { en: 'Brainstorming and early architecture exploration', id: 'Brainstorming dan eksplorasi arsitektur awal' },
    citationIds: ['chatgpt'],
  },
];

export const INTEGRITY_CITATIONS: IntegrityCitation[] = [
  {
    id: 'uhlen-2015',
    kind: 'publication',
    authors: 'Uhlen, M., Fagerberg, L., Hallstrom, B.M. et al.',
    year: '2015',
    title: 'Proteomics. Tissue-based map of the human proteome.',
    venue: 'Science, 347(6220), 1260419',
    url: 'https://doi.org/10.1126/science.1260419',
  },
  {
    id: 'thul-2018',
    kind: 'publication',
    authors: 'Thul, P.J. and Lindskog, C.',
    year: '2018',
    title: 'The human protein atlas: A spatial map of the human proteome.',
    venue: 'Protein Science, 27(1), pp.233-244',
    url: 'https://doi.org/10.1002/pro.3307',
  },
  {
    id: 'bray-2024',
    kind: 'publication',
    authors: 'Bray, F., Laversanne, M., Sung, H. et al.',
    year: '2024',
    title: 'Global cancer statistics 2022.',
    venue: 'CA: A Cancer Journal for Clinicians, 74(3), pp.229-263',
    url: 'https://doi.org/10.3322/caac.21834',
  },
  {
    id: 'perou-2000',
    kind: 'publication',
    authors: 'Perou, C.M., Sorlie, T., Eisen, M.B. et al.',
    year: '2000',
    title: 'Molecular portraits of human breast tumours.',
    venue: 'Nature, 406, pp.747-752',
    url: 'https://doi.org/10.1038/35021093',
  },
  {
    id: 'tcga-2012',
    kind: 'publication',
    authors: 'Cancer Genome Atlas Network',
    year: '2012',
    title: 'Comprehensive molecular portraits of human breast tumours.',
    venue: 'Nature, 490, pp.61-70',
    url: 'https://doi.org/10.1038/nature11412',
  },
  {
    id: 'gdc-portal',
    kind: 'software',
    authors: 'National Cancer Institute',
    year: 'n.d.',
    title: 'Genomic Data Commons Data Portal: TCGA-BRCA',
    venue: 'GDC Data Portal',
    url: 'https://portal.gdc.cancer.gov/projects/TCGA-BRCA',
  },
  {
    id: 'cellosaurus',
    kind: 'software',
    authors: 'SIB Swiss Institute of Bioinformatics',
    year: 'n.d.',
    title: 'Cellosaurus cell line knowledge resource',
    venue: 'Cellosaurus',
    url: 'https://www.cellosaurus.org/',
  },
  {
    id: 'xin-2016',
    kind: 'publication',
    authors: 'Xin, J. et al.',
    year: '2016',
    title: 'High-performance web services for querying gene and variant annotation.',
    venue: 'Genome Biology, 17, 91',
    url: 'https://doi.org/10.1186/s13059-016-0953-9',
  },
  {
    id: 'go-2021',
    kind: 'publication',
    authors: 'Gene Ontology Consortium',
    year: '2021',
    title: 'The Gene Ontology resource: enriching a GOld mine.',
    venue: 'Nucleic Acids Research, 49(D1), pp.D325-D334',
    url: 'https://doi.org/10.1093/nar/gkaa1113',
  },
  {
    id: 'kegg-2021',
    kind: 'publication',
    authors: 'Kanehisa, M. et al.',
    year: '2021',
    title: 'KEGG for taxonomy-based analysis of pathways and genomes.',
    venue: 'Nucleic Acids Research, 49(D1), pp.D545-D551',
    url: 'https://doi.org/10.1093/nar/gkaa970',
  },
  {
    id: 'reactome-2022',
    kind: 'publication',
    authors: 'Gillespie, M. et al.',
    year: '2022',
    title: 'The Reactome pathway knowledgebase 2022.',
    venue: 'Nucleic Acids Research, 50(D1), pp.D687-D692',
    url: 'https://doi.org/10.1093/nar/gkab1028',
  },
  {
    id: 'kaplan-meier-1958',
    kind: 'method',
    authors: 'Kaplan, E.L. and Meier, P.',
    year: '1958',
    title: 'Nonparametric estimation from incomplete observations.',
    venue: 'Journal of the American Statistical Association, 53(282), pp.457-481',
    url: 'https://doi.org/10.1080/01621459.1958.10501452',
  },
  {
    id: 'mantel-1966',
    kind: 'method',
    authors: 'Mantel, N.',
    year: '1966',
    title: 'Evaluation of survival data and two new rank order statistics arising in its consideration.',
    venue: 'Cancer Chemotherapy Reports, 50(3), pp.163-170',
    url: 'https://pubmed.ncbi.nlm.nih.gov/5910392/',
  },
  {
    id: 'cunningham-2022',
    kind: 'publication',
    authors: 'Cunningham, F. et al.',
    year: '2022',
    title: 'Ensembl 2022.',
    venue: 'Nucleic Acids Research, 50(D1), pp.D988-D995',
    url: 'https://doi.org/10.1093/nar/gkab1049',
  },
  {
    id: 'uniprot-2023',
    kind: 'publication',
    authors: 'UniProt Consortium',
    year: '2023',
    title: 'UniProt: the Universal Protein Knowledgebase in 2023.',
    venue: 'Nucleic Acids Research, 51(D1), pp.D523-D531',
    url: 'https://doi.org/10.1093/nar/gkac1052',
  },
  {
    id: 'open-targets-2021',
    kind: 'publication',
    authors: 'Ochoa, D. et al.',
    year: '2021',
    title: 'Open Targets Platform: supporting systematic drug-target identification and prioritisation.',
    venue: 'Nucleic Acids Research, 49(D1), pp.D1302-D1310',
    url: 'https://doi.org/10.1093/nar/gkaa1027',
  },
  {
    id: 'react-docs',
    kind: 'software',
    authors: 'React Team',
    year: 'n.d.',
    title: 'React documentation',
    venue: 'React',
    url: 'https://react.dev/',
  },
  {
    id: 'typescript-docs',
    kind: 'software',
    authors: 'Microsoft',
    year: 'n.d.',
    title: 'TypeScript documentation',
    venue: 'Microsoft Learn',
    url: 'https://www.typescriptlang.org/docs/',
  },
  {
    id: 'vite-docs',
    kind: 'software',
    authors: 'Vite Team',
    year: 'n.d.',
    title: 'Vite guide',
    venue: 'Vite',
    url: 'https://vite.dev/guide/',
  },
  {
    id: 'recharts-docs',
    kind: 'software',
    authors: 'Recharts Group',
    year: 'n.d.',
    title: 'Recharts documentation',
    venue: 'Recharts',
    url: 'https://recharts.org/en-US/guide',
  },
  {
    id: 'node-docs',
    kind: 'software',
    authors: 'OpenJS Foundation',
    year: 'n.d.',
    title: 'Node.js documentation',
    venue: 'Node.js',
    url: 'https://nodejs.org/docs/latest/api/',
  },
  {
    id: 'express-docs',
    kind: 'software',
    authors: 'OpenJS Foundation',
    year: 'n.d.',
    title: 'Express documentation',
    venue: 'Express',
    url: 'https://expressjs.com/',
  },
  {
    id: 'postgresql-docs',
    kind: 'software',
    authors: 'PostgreSQL Global Development Group',
    year: 'n.d.',
    title: 'PostgreSQL documentation',
    venue: 'PostgreSQL',
    url: 'https://www.postgresql.org/docs/',
  },
  {
    id: 'drizzle-docs',
    kind: 'software',
    authors: 'Drizzle Team',
    year: 'n.d.',
    title: 'Drizzle ORM documentation',
    venue: 'Drizzle ORM',
    url: 'https://orm.drizzle.team/docs/overview',
  },
  {
    id: 'sheetjs-docs',
    kind: 'software',
    authors: 'SheetJS LLC',
    year: 'n.d.',
    title: 'SheetJS documentation',
    venue: 'SheetJS',
    url: 'https://docs.sheetjs.com/',
  },
  {
    id: 'html-to-image',
    kind: 'software',
    authors: 'Bubkoo',
    year: 'n.d.',
    title: 'html-to-image',
    venue: 'GitHub repository',
    url: 'https://github.com/bubkoo/html-to-image',
  },
  {
    id: 'playwright-docs',
    kind: 'software',
    authors: 'Microsoft',
    year: 'n.d.',
    title: 'Playwright documentation',
    venue: 'Playwright',
    url: 'https://playwright.dev/docs/intro',
  },
  {
    id: 'chatgpt',
    kind: 'software',
    authors: 'OpenAI',
    year: 'n.d.',
    title: 'ChatGPT Plus',
    venue: 'OpenAI',
    url: 'https://openai.com/chatgpt/',
  },
  {
    id: 'openai-api',
    kind: 'software',
    authors: 'OpenAI',
    year: 'n.d.',
    title: 'OpenAI API documentation (compatible interface used through Replit AI Integrations)',
    venue: 'OpenAI Developers',
    url: 'https://platform.openai.com/docs/api-reference/chat',
  },
  {
    id: 'replit',
    kind: 'software',
    authors: 'Replit',
    year: 'n.d.',
    title: 'Replit development workspace and workflows',
    venue: 'Replit',
    url: 'https://docs.replit.com/',
  },
  {
    id: 'ibce-manuscript',
    kind: 'manuscript',
    authors: 'IBCE development team',
    year: '2026',
    title: 'IBCE: Integrative Breast Cancer Evidence Explorer',
    venue: 'Unpublished manuscript; project-reported ICATBIO 2026 submission, status not independently verified',
    url: 'https://icatbio.unesa.ac.id/',
  },
];

export function localizedText(text: BilingualText, lang: 'en' | 'id') {
  return text[lang];
}

export function formatIntegrityCitation(citation: IntegrityCitation, style: 'harvard' | 'apa' | 'vancouver' | 'ieee') {
  if (style === 'apa') {
    return `${citation.authors} (${citation.year}). ${citation.title}. ${citation.venue}. ${citation.url}`;
  }
  if (style === 'vancouver') {
    return `${citation.authors}. ${citation.title}. ${citation.venue}. ${citation.year}. Available from: ${citation.url}`;
  }
  if (style === 'ieee') {
    return `${citation.authors}, "${citation.title}," ${citation.venue}, ${citation.year}. [Online]. Available: ${citation.url}`;
  }
  return `${citation.authors} (${citation.year}) ${citation.title}. ${citation.venue}. Available at: ${citation.url}`;
}
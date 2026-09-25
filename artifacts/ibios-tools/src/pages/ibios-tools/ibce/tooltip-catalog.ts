export interface IbceSource {
  label: string;
  url: string;
}

export interface IbceGlossaryEntry {
  title: string;
  definition: string;
  interpretation?: string;
  sources: IbceSource[];
}

export type IbceGlossaryCategory =
  | 'navigation'
  | 'provenance'
  | 'protein'
  | 'survival'
  | 'rna'
  | 'visualization'
  | 'annotation'
  | 'citation';

const sources = {
  mygene: {
    label: 'Xin, J. et al. (2016). Genome Biology, 17, 91. DOI: 10.1186/s13059-016-0953-9',
    url: 'https://doi.org/10.1186/s13059-016-0953-9',
  },
  hpa: {
    label: 'Uhlén, M. et al. (2015). Science, 347(6220), 1260419. DOI: 10.1126/science.1260419',
    url: 'https://doi.org/10.1126/science.1260419',
  },
  hpaDownload: {
    label: 'Human Protein Atlas: downloadable data and data dictionaries',
    url: 'https://www.proteinatlas.org/about/download',
  },
  tcga: {
    label: 'Cancer Genome Atlas Network (2012). Nature, 490, 61-70. DOI: 10.1038/nature11412',
    url: 'https://doi.org/10.1038/nature11412',
  },
  tcgaNci: {
    label: 'National Cancer Institute: The Cancer Genome Atlas Program',
    url: 'https://www.cancer.gov/ccg/research/genome-sequencing/tcga',
  },
  go: {
    label: 'Gene Ontology Consortium (2021). Nucleic Acids Research, 49(D1), D325-D334. DOI: 10.1093/nar/gkaa1113',
    url: 'https://doi.org/10.1093/nar/gkaa1113',
  },
  goDocs: {
    label: 'Gene Ontology: ontology documentation',
    url: 'https://geneontology.org/docs/ontology-documentation/',
  },
  kegg: {
    label: 'Kanehisa, M. et al. (2021). Nucleic Acids Research, 49(D1), D545-D551. DOI: 10.1093/nar/gkaa970',
    url: 'https://doi.org/10.1093/nar/gkaa970',
  },
  reactome: {
    label: 'Gillespie, M. et al. (2022). Nucleic Acids Research, 50(D1), D687-D692. DOI: 10.1093/nar/gkab1028',
    url: 'https://doi.org/10.1093/nar/gkab1028',
  },
  kaplanMeier: {
    label: 'Kaplan, E.L. and Meier, P. (1958). JASA, 53(282), 457-481. DOI: 10.1080/01621459.1958.10501452',
    url: 'https://doi.org/10.1080/01621459.1958.10501452',
  },
  logRank: {
    label: 'Mantel, N. (1966). Cancer Chemotherapy Reports, 50(3), 163-170. PMID: 5910392',
    url: 'https://pubmed.ncbi.nlm.nih.gov/5910392/',
  },
  ensembl: {
    label: 'Cunningham, F. et al. (2022). Nucleic Acids Research, 50(D1), D988-D995. DOI: 10.1093/nar/gkab1049',
    url: 'https://doi.org/10.1093/nar/gkab1049',
  },
  ensemblStable: {
    label: 'Ensembl: stable identifier documentation',
    url: 'https://www.ensembl.org/info/genome/stable_ids/index.html',
  },
  uniprot: {
    label: 'UniProt Consortium (2023). Nucleic Acids Research, 51(D1), D523-D531. DOI: 10.1093/nar/gkac1052',
    url: 'https://doi.org/10.1093/nar/gkac1052',
  },
  openTargets: {
    label: 'Ochoa, D. et al. (2021). Nucleic Acids Research, 49(D1), D1302-D1310. DOI: 10.1093/nar/gkaa1027',
    url: 'https://doi.org/10.1093/nar/gkaa1027',
  },
};

export const IBCE_GLOSSARY = {
  geneSearch: {
    title: 'Gene search',
    definition: 'Searches IBCE records by approved gene symbol, descriptive gene name, or an Ensembl gene identifier. At least two characters are required for indexed suggestions.',
    interpretation: 'A search match identifies a reference record. It does not establish disease causality or clinical actionability.',
    sources: [sources.ensembl, sources.ensemblStable],
  },
  geneSymbol: {
    title: 'Gene symbol',
    definition: 'A short standardized label used to identify a gene, such as BRCA1 or ERBB2. Symbols are convenient labels and can change when nomenclature is updated.',
    interpretation: 'Use a stable identifier, such as an Ensembl gene ID, when exact version-independent identity matters.',
    sources: [sources.ensemblStable],
  },
  ensemblId: {
    title: 'Ensembl gene ID',
    definition: 'A stable Ensembl identifier for a genomic feature. Human gene identifiers commonly begin with ENSG.',
    interpretation: 'Stable IDs reduce ambiguity across names and symbols, but records can still be versioned or retired between releases.',
    sources: [sources.ensembl, sources.ensemblStable],
  },
  datasetStatus: {
    title: 'Dataset ingestion status',
    definition: 'Ready or ingested means that IBCE has loaded records from that source layer into its local reference index. Pending or not ingested means the layer is not currently queryable.',
    interpretation: 'Row count reports stored rows, not unique patients, independent biological replicates, or evidence quality.',
    sources: [],
  },
  dataAvailability: {
    title: 'Data availability badge',
    definition: 'A filled circle means the dossier contains records for that evidence layer. For clinical, at least one TCGA clinical case matches a patient RNA sample for this gene; the count uses all gene samples, not just displayed rows.',
    interpretation: 'This broad availability count is not the primary-tumor survival cohort. Survival separately filters sample type, expression validity, vital status, and follow-up. Absence of a record is not evidence that the biological feature is absent.',
    sources: [],
  },
  identityCrosswalk: {
    title: 'Identity crosswalk',
    definition: 'Maps the same gene or protein to identifiers and records maintained by external reference resources.',
    interpretation: 'External resources use different update schedules and scopes, so fields may not be identical.',
    sources: [sources.ensembl, sources.uniprot, sources.openTargets],
  },
  geneComparison: {
    title: 'Gene comparison',
    definition: 'Adds a second gene to supported expression panels so values can be visually compared within matching cell lines or samples.',
    interpretation: 'The display is descriptive and does not test whether the genes differ statistically or interact biologically.',
    sources: [],
  },
  ihc: {
    title: 'Immunohistochemistry (IHC)',
    definition: 'An antibody-based method used to visualize protein staining in tissue sections. IBCE summarizes sample counts assigned to staining-level categories.',
    interpretation: 'Staining categories depend on antibody performance, tissue handling, scoring rules, and available samples. They are not direct measurements of RNA abundance.',
    sources: [sources.hpa, sources.hpaDownload],
  },
  ihcLevels: {
    title: 'IHC staining levels and colors',
    definition: 'Orange, amber, light slate, and dark slate encode High, Medium, Low, and Not detected categories. The number beside each label is the sample count in that category.',
    interpretation: 'Color is redundant with text labels and does not imply benefit, harm, or clinical prognosis.',
    sources: [sources.hpaDownload],
  },
  sampleCount: {
    title: 'Sample count (n)',
    definition: 'The number of observations represented in the displayed group.',
    interpretation: 'The count alone does not describe independence, missingness, cohort balance, or statistical power.',
    sources: [],
  },
  prognosis: {
    title: 'Prognostic association',
    definition: 'A cohort-level association between gene expression grouping and observed survival outcomes in a specified cancer context.',
    interpretation: 'Association is not causation and is not an individualized prognosis, diagnostic result, or treatment recommendation.',
    sources: [sources.tcga, sources.tcgaNci],
  },
  cancerContext: {
    title: 'Cancer context',
    definition: 'The tumor type or cohort within which an expression-survival association was evaluated.',
    interpretation: 'Results should not be generalized to other cancer types, populations, endpoints, or treatment settings without validation.',
    sources: [sources.tcga],
  },
  prognosisClass: {
    title: 'Prognosis classification badge',
    definition: 'Favorable and unfavorable label the direction of the observed cohort-level association. Unprognostic means the source did not classify the gene as prognostic under the displayed analysis.',
    interpretation: 'Green, red, and amber are categorical cues only. They do not provide a clinical risk estimate for an individual.',
    sources: [sources.hpa, sources.tcga],
  },
  pValue: {
    title: 'p-value',
    definition: 'A probability calculated under a null model. Smaller values indicate that results at least this extreme would be less compatible with that null model.',
    interpretation: 'A p-value is not the probability that a hypothesis is true, an effect size, or proof of clinical importance.',
    sources: [sources.logRank],
  },
  kaplanMeier: {
    title: 'Kaplan-Meier survival curve',
    definition: 'A stepwise estimate of the probability of remaining event-free beyond each observed time. Steps occur at event times, while censored observations reduce later risk sets without causing a step.',
    interpretation: 'The curve is descriptive of the analyzed cohort and depends on endpoint definition, follow-up, censoring, and group construction.',
    sources: [sources.kaplanMeier],
  },
  survivalProbability: {
    title: 'Survival probability',
    definition: 'The Kaplan-Meier estimate, from 0 to 1 or 0% to 100%, of the proportion expected to remain event-free beyond a given time.',
    interpretation: 'It is a cohort estimate with uncertainty, not a prediction for a specific patient.',
    sources: [sources.kaplanMeier],
  },
  logRank: {
    title: 'Log-rank p-value',
    definition: 'The log-rank test compares the full survival experience of two groups under a null hypothesis of no difference between their survival functions.',
    interpretation: 'This exploratory, asymptotic p-value is shown only with at least five deaths per group. It does not quantify effect size, adjust for confounders or multiple gene searches, or establish a clinical cutoff.',
    sources: [sources.logRank],
  },
  medianCutoff: {
    title: 'Median expression cutoff',
    definition: 'The analyzed cohort uses the arithmetic sample median of primary-tumor pTPM (average of the middle two when even). Values at or above it are high; values below it are low.',
    interpretation: 'Ties may make group sizes unequal. The data-driven split is not a validated diagnostic threshold.',
    sources: [sources.kaplanMeier, sources.tcga],
  },
  rnaExpression: {
    title: 'RNA expression',
    definition: 'Sequencing-derived abundance of transcripts assigned to a gene. IBCE displays normalized values supplied by the referenced source layer.',
    interpretation: 'RNA abundance does not directly equal protein abundance or biological activity, and comparisons depend on normalization and sample context.',
    sources: [sources.hpa, sources.hpaDownload],
  },
  cellLine: {
    title: 'Cancer cell line',
    definition: 'A population of tumor-derived cells maintained in culture and used as an experimental model.',
    interpretation: 'Cell lines can diverge from primary tumors through selection, adaptation, and culture conditions.',
    sources: [sources.hpa],
  },
  patientSample: {
    title: 'Patient cancer sample',
    definition: 'A tumor specimen represented in the source RNA dataset. The displayed identifier refers to a sample record, not a clinical recommendation.',
    interpretation: 'Samples can differ in tumor purity, composition, processing, and clinical context.',
    sources: [sources.tcga, sources.hpaDownload],
  },
  ntpm: {
    title: 'nTPM',
    definition: 'Normalized transcripts per million, an HPA expression unit used to compare gene RNA abundance across samples after source-specific normalization.',
    interpretation: 'Use values as relative abundance within the documented dataset. They are not absolute molecule counts and should not be compared blindly across pipelines.',
    sources: [sources.hpaDownload],
  },
  ptpm: {
    title: 'pTPM',
    definition: 'Protein-coding transcripts per million, an HPA-derived expression value normalized within the protein-coding transcript space used by the source layer.',
    interpretation: 'Values are pipeline-dependent normalized abundance, not protein measurements or universal clinical thresholds.',
    sources: [sources.hpaDownload],
  },
  ranking: {
    title: 'Ranking and Top N filter',
    definition: 'Sort controls change display order. Top N restricts the visible chart to the first N rows after sorting. All retains every loaded row.',
    interpretation: 'Filtering changes the view only. Exports retain the complete source rows supplied to the panel.',
    sources: [],
  },
  chartColors: {
    title: 'Chart comparison colors',
    definition: 'Orange represents the primary dossier gene and blue represents the optional comparison gene. In survival panels, green is the high-expression group and purple is the low-expression group.',
    interpretation: 'Colors distinguish series only and do not encode benefit, harm, confidence, or significance.',
    sources: [],
  },
  tissueColors: {
    title: 'Patient sample colors',
    definition: 'Each color identifies a tissue or cancer-type label shown in the text legend. Colors repeat only if the number of categories exceeds the palette.',
    interpretation: 'Color does not represent expression magnitude, prognosis, or evidence quality.',
    sources: [],
  },
  exportPng: {
    title: 'PNG figure export',
    definition: 'Downloads a two-times-resolution raster image of the visible panel, including its current background, chart state, labels, and legends.',
    interpretation: 'PNG contains no machine-readable table and reflects the current view, including Top N filters.',
    sources: [],
  },
  exportCsv: {
    title: 'CSV data export',
    definition: 'Downloads the panel data as comma-separated text with a header row. Numeric units are named in the exported columns.',
    interpretation: 'CSV preserves values, not chart styling. Check the panel definition and source before combining with other datasets.',
    sources: [],
  },
  exportTsv: {
    title: 'TSV data export',
    definition: 'Downloads the same tabular panel data as tab-separated text, which can be safer when labels contain commas.',
    interpretation: 'TSV preserves values, not chart styling or statistical interpretation.',
    sources: [],
  },
  exportXls: {
    title: 'Excel workbook export',
    definition: 'Downloads an XLSX workbook containing the panel table in a named worksheet. The button is labeled XLS for compact display.',
    interpretation: 'Spreadsheet formatting does not add validation, provenance, or clinical meaning to the exported values.',
    sources: [],
  },
  backgroundToggle: {
    title: 'Chart background',
    definition: 'Switches only the panel presentation between dark and light backgrounds, including subsequent PNG export.',
    interpretation: 'This control does not modify values, ranking, grouping, or analysis results.',
    sources: [],
  },
  mygene: {
    title: 'MyGene.info',
    definition: 'A web service that aggregates gene annotations from multiple biological databases and exposes them through a query interface.',
    interpretation: 'Aggregated fields retain the scope and update constraints of their contributing resources.',
    sources: [sources.mygene],
  },
  biologicalProcess: {
    title: 'GO Biological Process',
    definition: 'A Gene Ontology term describing a biological program accomplished by one or more ordered molecular activities, such as DNA repair or signaling.',
    interpretation: 'An annotation indicates curated or inferred knowledge according to GO evidence, not measured activity in the displayed patient samples.',
    sources: [sources.go, sources.goDocs],
  },
  molecularFunction: {
    title: 'GO Molecular Function',
    definition: 'A Gene Ontology term describing an elemental activity of a gene product, such as binding or catalytic activity.',
    interpretation: 'It describes activity type, not where or when the activity occurs and not its disease effect.',
    sources: [sources.go, sources.goDocs],
  },
  cellularComponent: {
    title: 'GO Cellular Component',
    definition: 'A Gene Ontology term describing where a gene product is located or acts in relation to cellular structures, such as the nucleus, membrane, or a protein complex.',
    interpretation: 'An annotation reports curated or inferred knowledge aggregated by MyGene.info. It does not measure localization in the displayed tumor or sample.',
    sources: [sources.mygene, sources.go, sources.goDocs],
  },
  kegg: {
    title: 'KEGG pathway',
    definition: 'A curated pathway record connecting molecular entities and reactions within a biological system.',
    interpretation: 'Membership provides functional context. It does not prove pathway activation in the displayed tumor or sample.',
    sources: [sources.kegg],
  },
  reactome: {
    title: 'Reactome pathway',
    definition: 'A manually curated and peer-reviewed pathway knowledgebase describing human biological reactions and processes.',
    interpretation: 'Pathway membership is reference knowledge and does not establish activity in a specific sample.',
    sources: [sources.reactome],
  },
  navDataSources: {
    title: 'Data Sources section',
    definition: 'Opens the operational registry for IBCE source layers, including provider names, local row counts, and ingestion state.',
    interpretation: 'This section documents what data are locally available. The full publication library is maintained separately in Citation.',
    sources: [sources.hpaDownload, sources.tcgaNci],
  },
  navMethods: {
    title: 'Methods and resources section',
    definition: 'Explains the algorithms, equations, annotation services, visualization software, exports, and development tools used by IBCE.',
    interpretation: 'Applicable resources include a Harvard University citation in the same card. Project-specific design choices are labeled separately from published methods.',
    sources: [sources.kaplanMeier, sources.logRank, sources.mygene],
  },
  navGlossary: {
    title: 'Scientific glossary section',
    definition: 'Provides searchable bilingual definitions, categories, scientific limitations, and source links for terminology used throughout IBCE.',
    interpretation: 'Glossary explanations support interpretation but do not replace the original source publication or clinical guidance.',
    sources: [],
  },
  navCitation: {
    title: 'Citation section',
    definition: 'Maintains the complete IBCE reference library, method citations, software attribution, and the current manuscript status.',
    interpretation: 'Harvard University is the default display format. APA, Vancouver, and IEEE are optional output formats.',
    sources: [],
  },
  navDownloadCenter: {
    title: 'Download Center',
    definition: 'Provides complete normalized dataset packages and current manifest for auditable data access.',
    interpretation: 'Normalized datasets are derived for IBCE consumption. For primary analysis, researchers should consult the original sources.',
    sources: [sources.tcgaNci, sources.hpaDownload],
  },
  bibliography: {
    title: 'Provenance bibliography',
    definition: 'The registry of publications and official resources used to document IBCE source layers and methods.',
    interpretation: 'A citation supports the stated data source or method. It does not independently validate every downstream interpretation.',
    sources: [],
  },
  ingestion: {
    title: 'Dataset ingestion',
    definition: 'Downloads every supported HPA and TCGA source file, replaces the corresponding local IBCE tables, and refreshes the records used by search and dossier endpoints.',
    interpretation: 'This is a potentially long-running administrative reload, not a lightweight status refresh. It does not recompute source measurements or certify data quality.',
    sources: [],
  },
} satisfies Record<string, IbceGlossaryEntry>;

export type IbceGlossaryKey = keyof typeof IBCE_GLOSSARY;

export const IBCE_GLOSSARY_CATEGORIES = {
  geneSearch: 'navigation', geneSymbol: 'navigation', ensemblId: 'navigation',
  datasetStatus: 'provenance', dataAvailability: 'provenance', identityCrosswalk: 'provenance',
  geneComparison: 'navigation',
  ihc: 'protein', ihcLevels: 'protein',
  sampleCount: 'survival', prognosis: 'survival', cancerContext: 'survival',
  prognosisClass: 'survival', pValue: 'survival', kaplanMeier: 'survival',
  survivalProbability: 'survival', logRank: 'survival', medianCutoff: 'survival',
  rnaExpression: 'rna', cellLine: 'rna', patientSample: 'rna', ntpm: 'rna', ptpm: 'rna',
  ranking: 'visualization', chartColors: 'visualization', tissueColors: 'visualization',
  exportPng: 'visualization', exportCsv: 'visualization', exportTsv: 'visualization',
  exportXls: 'visualization', backgroundToggle: 'visualization',
  mygene: 'annotation', biologicalProcess: 'annotation', molecularFunction: 'annotation',
  cellularComponent: 'annotation', kegg: 'annotation', reactome: 'annotation',
  navDataSources: 'navigation', navMethods: 'navigation', navGlossary: 'navigation',
  navCitation: 'navigation', navDownloadCenter: 'navigation', bibliography: 'citation', ingestion: 'provenance',
} satisfies Record<IbceGlossaryKey, IbceGlossaryCategory>;

const idTitles: Partial<Record<IbceGlossaryKey, string>> = {
  geneSearch: 'Pencarian gen', geneSymbol: 'Simbol gen', ensemblId: 'ID gen Ensembl',
  datasetStatus: 'Status ingest dataset', dataAvailability: 'Lencana ketersediaan data',
  identityCrosswalk: 'Pemetaan identitas', geneComparison: 'Perbandingan gen',
  ihc: 'Imunohistokimia (IHC)', ihcLevels: 'Tingkat dan warna pewarnaan IHC',
  sampleCount: 'Jumlah sampel (n)', prognosis: 'Asosiasi prognostik', cancerContext: 'Konteks kanker',
  prognosisClass: 'Lencana klasifikasi prognosis', pValue: 'nilai p', kaplanMeier: 'Kurva kelangsungan hidup Kaplan-Meier',
  survivalProbability: 'Probabilitas kelangsungan hidup', logRank: 'nilai p log-rank',
  medianCutoff: 'Ambang ekspresi median', rnaExpression: 'Ekspresi RNA', cellLine: 'Lini sel kanker',
  patientSample: 'Sampel kanker pasien', ranking: 'Peringkat dan filter N teratas',
  chartColors: 'Warna perbandingan grafik', tissueColors: 'Warna sampel pasien',
  exportPng: 'Ekspor gambar PNG', exportCsv: 'Ekspor data CSV', exportTsv: 'Ekspor data TSV',
  exportXls: 'Ekspor buku kerja Excel', backgroundToggle: 'Latar belakang grafik',
  bibliography: 'Bibliografi asal data', ingestion: 'Ingest dataset',
  mygene: 'MyGene.info', biologicalProcess: 'GO Proses Biologis',
  molecularFunction: 'GO Fungsi Molekuler', cellularComponent: 'GO Komponen Seluler',
  kegg: 'Jalur KEGG', reactome: 'Jalur Reactome',
  navDataSources: 'Bagian Sumber Data', navMethods: 'Bagian Metode dan sumber',
  navGlossary: 'Bagian glosarium ilmiah', navCitation: 'Bagian sitasi', navDownloadCenter: 'Pusat Unduhan',
};

const idText: Record<IbceGlossaryKey, Pick<IbceGlossaryEntry, 'definition' | 'interpretation'>> = {
  geneSearch: { definition: 'Mencari rekaman IBCE berdasarkan simbol gen yang disetujui, nama gen deskriptif, atau pengenal gen Ensembl. Saran terindeks memerlukan sedikitnya dua karakter.', interpretation: 'Kecocokan pencarian mengidentifikasi rekaman referensi. Ini tidak menetapkan kausalitas penyakit atau keterlaksanaan klinis.' },
  geneSymbol: { definition: 'Label standar singkat untuk mengenali gen, misalnya BRCA1 atau ERBB2. Simbol dapat berubah saat nomenklatur diperbarui.', interpretation: 'Gunakan pengenal stabil seperti ID gen Ensembl bila identitas tepat tanpa bergantung versi diperlukan.' },
  ensemblId: { definition: 'Pengenal Ensembl stabil bagi fitur genomik. Pengenal gen manusia lazimnya diawali ENSG.', interpretation: 'ID stabil mengurangi ambiguitas nama dan simbol, tetapi rekaman tetap dapat diberi versi atau dihentikan antar-rilis.' },
  datasetStatus: { definition: 'Siap atau sudah diingest berarti IBCE telah memuat rekaman dari lapisan sumber tersebut ke indeks referensi lokal. Menunggu atau belum diingest berarti lapisan belum dapat dikueri.', interpretation: 'Jumlah baris melaporkan baris tersimpan, bukan pasien unik, replikasi biologis independen, atau kualitas bukti.' },
  dataAvailability: { definition: 'Lingkaran terisi berarti dossier memuat rekaman untuk lapisan bukti tersebut. Untuk klinis, setidaknya satu kasus klinis TCGA cocok dengan sampel RNA pasien gen ini; penghitungan memakai seluruh sampel gen, bukan hanya baris yang ditampilkan.', interpretation: 'Jumlah ketersediaan ini bukan kohort kesintasan tumor primer. Analisis kesintasan menyaring tipe sampel, keabsahan ekspresi, status vital, dan waktu tindak lanjut secara terpisah. Tidak adanya rekaman bukan bukti bahwa fitur biologis tidak ada.' },
  identityCrosswalk: { definition: 'Memetakan gen atau protein yang sama ke pengenal dan rekaman yang dikelola sumber referensi eksternal.', interpretation: 'Sumber eksternal memiliki jadwal pembaruan dan cakupan berbeda sehingga bidangnya dapat tidak identik.' },
  geneComparison: { definition: 'Menambahkan gen kedua ke panel ekspresi yang didukung agar nilai dapat dibandingkan pada lini sel atau sampel yang cocok.', interpretation: 'Tampilan ini bersifat deskriptif dan tidak menguji perbedaan statistik atau interaksi biologis.' },
  ihc: { definition: 'Metode berbasis antibodi untuk memvisualisasikan pewarnaan protein pada irisan jaringan. IBCE merangkum jumlah sampel menurut kategori tingkat pewarnaan.', interpretation: 'Kategori pewarnaan bergantung pada kinerja antibodi, penanganan jaringan, aturan penilaian, dan sampel yang tersedia. Ini bukan pengukuran langsung kelimpahan RNA.' },
  ihcLevels: { definition: 'Warna mengodekan kategori Tinggi, Sedang, Rendah, dan Tidak terdeteksi. Angka di samping label adalah jumlah sampel dalam kategori.', interpretation: 'Warna dilengkapi label teks dan tidak menyiratkan manfaat, bahaya, atau prognosis klinis.' },
  sampleCount: { definition: 'Jumlah observasi yang direpresentasikan dalam kelompok yang ditampilkan.', interpretation: 'Jumlah saja tidak menjelaskan independensi, data hilang, keseimbangan kohort, atau kekuatan statistik.' },
  prognosis: { definition: 'Asosiasi tingkat kohort antara pengelompokan ekspresi gen dan luaran kelangsungan hidup yang diamati dalam konteks kanker tertentu.', interpretation: 'Asosiasi bukan kausalitas dan bukan prognosis individual, hasil diagnostik, atau rekomendasi terapi.' },
  cancerContext: { definition: 'Jenis tumor atau kohort tempat asosiasi ekspresi dan kelangsungan hidup dievaluasi.', interpretation: 'Hasil tidak boleh digeneralisasikan ke jenis kanker, populasi, titik akhir, atau pengobatan lain tanpa validasi.' },
  prognosisClass: { definition: 'Favorable dan unfavorable menandai arah asosiasi tingkat kohort yang diamati. Unprognostic berarti sumber tidak mengklasifikasikan gen sebagai prognostik pada analisis yang ditampilkan.', interpretation: 'Hijau, merah, dan jingga hanyalah isyarat kategori. Warna tidak memberikan perkiraan risiko klinis individual.' },
  pValue: { definition: 'Probabilitas yang dihitung di bawah model nol. Nilai lebih kecil menunjukkan hasil setidaknya seekstrem ini kurang sesuai dengan model nol.', interpretation: 'Nilai p bukan probabilitas hipotesis benar, bukan ukuran efek, dan bukan bukti kepentingan klinis.' },
  kaplanMeier: { definition: 'Estimasi bertahap peluang tetap bebas kejadian melampaui setiap waktu yang diamati. Langkah terjadi saat kejadian; pengamatan tersensor mengurangi kelompok berisiko berikutnya tanpa langkah.', interpretation: 'Kurva bersifat deskriptif untuk kohort yang dianalisis dan bergantung pada definisi titik akhir, tindak lanjut, sensor, serta pembentukan kelompok.' },
  survivalProbability: { definition: 'Estimasi Kaplan-Meier dari 0 hingga 1 atau 0% hingga 100% untuk proporsi yang diperkirakan tetap bebas kejadian melewati waktu tertentu.', interpretation: 'Ini adalah estimasi kohort dengan ketidakpastian, bukan prediksi bagi pasien tertentu.' },
  logRank: { definition: 'Uji log-rank membandingkan pengalaman kelangsungan hidup penuh dua kelompok dengan hipotesis nol tidak ada perbedaan fungsi kelangsungan hidup.', interpretation: 'Nilai p asimtotik eksploratoris hanya ditampilkan jika tiap kelompok memiliki sedikitnya lima kematian. Nilai ini tidak mengukur besar efek, menyesuaikan perancu atau pengujian banyak gen, maupun menetapkan ambang klinis.' },
  medianCutoff: { definition: 'Kohort yang dianalisis memakai median sampel aritmetis pTPM tumor primer (rata-rata dua nilai tengah jika jumlah genap). Nilai pada atau di atas median masuk kelompok tinggi; sisanya rendah.', interpretation: 'Nilai seri dapat membuat ukuran kelompok berbeda. Pemisahan berbasis data ini bukan ambang diagnostik tervalidasi.' },
  rnaExpression: { definition: 'Kelimpahan transkrip suatu gen yang diturunkan dari pengurutan. IBCE menampilkan nilai ternormalisasi dari lapisan sumber yang dirujuk.', interpretation: 'Kelimpahan RNA tidak langsung sama dengan kelimpahan protein atau aktivitas biologis; perbandingan bergantung pada normalisasi dan konteks sampel.' },
  cellLine: { definition: 'Populasi sel turunan tumor yang dipelihara dalam kultur dan digunakan sebagai model eksperimental.', interpretation: 'Lini sel dapat menyimpang dari tumor primer akibat seleksi, adaptasi, dan kondisi kultur.' },
  patientSample: { definition: 'Spesimen tumor yang diwakili dalam dataset RNA sumber. Pengenal yang ditampilkan merujuk rekaman sampel, bukan rekomendasi klinis.', interpretation: 'Sampel dapat berbeda dalam kemurnian tumor, komposisi, pemrosesan, dan konteks klinis.' },
  ntpm: { definition: 'Normalized transcripts per million, satuan ekspresi HPA untuk membandingkan kelimpahan RNA gen antarsampel setelah normalisasi khusus sumber.', interpretation: 'Gunakan sebagai kelimpahan relatif dalam dataset terdokumentasi. Nilai bukan jumlah molekul absolut dan tidak boleh dibandingkan tanpa pertimbangan antar-pipeline.' },
  ptpm: { definition: 'Protein-coding transcripts per million, nilai ekspresi turunan HPA yang dinormalisasi dalam ruang transkrip pengode protein pada lapisan sumber.', interpretation: 'Nilai adalah kelimpahan ternormalisasi yang bergantung pipeline, bukan pengukuran protein atau ambang klinis universal.' },
  ranking: { definition: 'Kontrol urut mengubah urutan tampilan. N teratas membatasi grafik pada N baris pertama setelah pengurutan. Semua mempertahankan setiap baris termuat.', interpretation: 'Penyaringan hanya mengubah tampilan. Ekspor mempertahankan seluruh baris sumber yang diberikan ke panel.' },
  chartColors: { definition: 'Jingga menunjukkan gen dossier utama dan biru menunjukkan gen pembanding opsional. Pada panel kelangsungan hidup, hijau menunjukkan kelompok ekspresi tinggi dan ungu kelompok rendah.', interpretation: 'Warna hanya membedakan seri dan tidak mengodekan manfaat, bahaya, keyakinan, atau signifikansi.' },
  tissueColors: { definition: 'Setiap warna mengidentifikasi label jaringan atau jenis kanker pada legenda teks. Warna hanya berulang bila jumlah kategori melebihi palet.', interpretation: 'Warna tidak mewakili besar ekspresi, prognosis, atau kualitas bukti.' },
  exportPng: { definition: 'Mengunduh gambar raster resolusi dua kali dari panel yang terlihat, termasuk latar, keadaan grafik, label, dan legenda saat ini.', interpretation: 'PNG tidak memuat tabel yang dapat dibaca mesin dan mencerminkan tampilan saat ini, termasuk filter N teratas.' },
  exportCsv: { definition: 'Mengunduh data panel sebagai teks dipisahkan koma dengan baris header. Satuan numerik dinamai pada kolom ekspor.', interpretation: 'CSV mempertahankan nilai, bukan gaya grafik. Periksa definisi panel dan sumber sebelum menggabungkan dataset.' },
  exportTsv: { definition: 'Mengunduh data panel tabular yang sama sebagai teks dipisahkan tab, yang lebih aman bila label mengandung koma.', interpretation: 'TSV mempertahankan nilai, bukan gaya grafik atau interpretasi statistik.' },
  exportXls: { definition: 'Mengunduh buku kerja XLSX yang berisi tabel panel dalam lembar kerja bernama. Tombol berlabel XLS agar ringkas.', interpretation: 'Format lembar kerja tidak menambahkan validasi, asal data, atau makna klinis pada nilai yang diekspor.' },
  backgroundToggle: { definition: 'Mengubah presentasi panel saja antara latar gelap dan terang, termasuk ekspor PNG berikutnya.', interpretation: 'Kontrol ini tidak mengubah nilai, peringkat, pengelompokan, atau hasil analisis.' },
  mygene: { definition: 'Layanan web yang mengagregasi anotasi gen dari berbagai basis data biologis dan menyediakannya melalui antarmuka kueri.', interpretation: 'Bidang agregat tetap mengikuti cakupan dan batas pembaruan sumber penyusunnya.' },
  biologicalProcess: { definition: 'Istilah Gene Ontology yang menjelaskan program biologis yang dicapai oleh satu atau lebih aktivitas molekuler berurutan, seperti perbaikan DNA atau pensinyalan.', interpretation: 'Anotasi menunjukkan pengetahuan terkurasi atau tersimpulkan menurut bukti GO, bukan aktivitas terukur pada sampel pasien yang ditampilkan.' },
  molecularFunction: { definition: 'Istilah Gene Ontology yang menjelaskan aktivitas elementer produk gen, seperti pengikatan atau aktivitas katalitik.', interpretation: 'Istilah ini menjelaskan jenis aktivitas, bukan tempat atau waktu aktivitas terjadi maupun efek penyakitnya.' },
  cellularComponent: { definition: 'Istilah Gene Ontology yang menjelaskan lokasi atau aksi produk gen terkait struktur seluler, seperti nukleus, membran, atau kompleks protein.', interpretation: 'Anotasi melaporkan pengetahuan terkurasi atau tersimpulkan yang diagregasi MyGene.info. Ini tidak mengukur lokalisasi pada tumor atau sampel yang ditampilkan.' },
  kegg: { definition: 'Rekaman jalur terkurasi yang menghubungkan entitas molekuler dan reaksi dalam sistem biologis.', interpretation: 'Keanggotaan memberi konteks fungsional, tetapi tidak membuktikan aktivasi jalur pada tumor atau sampel yang ditampilkan.' },
  reactome: { definition: 'Basis pengetahuan jalur yang dikurasi manual dan ditinjau sejawat tentang reaksi serta proses biologis manusia.', interpretation: 'Keanggotaan jalur adalah pengetahuan referensi dan tidak menetapkan aktivitas pada sampel tertentu.' },
  navDataSources: { definition: 'Membuka registri operasional lapisan sumber IBCE, termasuk nama penyedia, jumlah baris lokal, dan status ingest.', interpretation: 'Bagian ini mendokumentasikan data yang tersedia secara lokal. Pustaka publikasi lengkap dikelola secara terpisah di Sitasi.' },
  navMethods: { definition: 'Menjelaskan algoritma, persamaan, layanan anotasi, software visualisasi, ekspor, dan perangkat pengembangan yang digunakan IBCE.', interpretation: 'Resource yang relevan memuat sitasi Harvard University di dalam card yang sama. Pilihan desain khusus proyek diberi label terpisah dari metode terpublikasi.' },
  navGlossary: { definition: 'Menyediakan definisi bilingual yang dapat dicari, kategori, batasan ilmiah, dan tautan sumber untuk istilah yang digunakan di seluruh IBCE.', interpretation: 'Penjelasan glosarium mendukung interpretasi, tetapi tidak menggantikan publikasi sumber atau panduan klinis.' },
  navCitation: { definition: 'Mengelola pustaka referensi lengkap IBCE, sitasi metode, atribusi software, dan status naskah saat ini.', interpretation: 'Harvard University adalah format tampilan default. APA, Vancouver, dan IEEE tersedia sebagai format keluaran opsional.' },
  navDownloadCenter: { definition: 'Menyediakan paket dataset yang dinormalisasi lengkap dan manifes saat ini untuk akses data yang dapat diaudit.', interpretation: 'Dataset yang dinormalisasi diturunkan untuk konsumsi IBCE. Untuk analisis primer, peneliti harus berkonsultasi dengan sumber asli.' },
  bibliography: { definition: 'Registri publikasi dan sumber resmi yang digunakan untuk mendokumentasikan lapisan sumber serta metode IBCE.', interpretation: 'Sitasi mendukung sumber data atau metode yang dinyatakan, tetapi tidak memvalidasi secara mandiri setiap interpretasi hilir.' },
  ingestion: { definition: 'Mengunduh setiap berkas sumber HPA dan TCGA yang didukung, mengganti tabel IBCE lokal terkait, serta memperbarui rekaman untuk endpoint pencarian dan dossier.', interpretation: 'Ini adalah pemuatan ulang administratif yang berpotensi lama, bukan penyegaran status ringan. Proses ini tidak menghitung ulang pengukuran sumber atau menjamin kualitas data.' },
};

export function getIbceGlossary(lang: 'en' | 'id') {
  if (lang === 'en') return IBCE_GLOSSARY;
  return Object.fromEntries(Object.entries(IBCE_GLOSSARY).map(([key, entry]) => [
    key,
    { ...entry, title: idTitles[key as IbceGlossaryKey] ?? entry.title, ...idText[key as IbceGlossaryKey] },
  ])) as typeof IBCE_GLOSSARY;
}

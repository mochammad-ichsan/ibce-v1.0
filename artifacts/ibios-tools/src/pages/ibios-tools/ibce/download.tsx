import { useLocation } from 'wouter';
import { 
  ArrowLeft, Download, FileJson, FileArchive, CheckCircle2, 
  AlertCircle, Clock, ShieldCheck, Database, ExternalLink 
} from 'lucide-react';
import { useIbceDownloadCatalog, useIbceDownloadHistory, useIbceDownloadManifest, getIbceDownloadHistoryQueryKey, getIbceDownloadDatasetCsvUrl, getIbceDownloadPackageUrl, getIbceDownloadManifestUrl } from '@workspace/api-client-react';
import { localizedDatasetDescription, localizedDatasetLabel, useIbceLocale } from './locale';
import { IbceSectionNav } from './section-nav';
import './ibce.css';

const downloadEn = {
  downloadHeroTitle: 'Download Center',
  downloadHeroDesc: 'Secure, auditable access to normalized IBCE reference datasets. These are research exports derived from public sources, formatted for computational biology pipelines, not for clinical decision-making.',
  downloadPackage: 'Complete Package',
  downloadPackageDesc: 'A single ZIP of six normalized dataset CSVs, README.txt, and manifest.json, when all six layers contain rows. The completed ZIP response checksum appears in export history.',
  packageUnavailable: 'The complete ZIP requires all six datasets to contain rows. Download available CSVs individually or check Data Sources for ingest status.',
  downloadManifest: 'Data Manifest',
  downloadManifestDesc: 'A JSON manifest of current schemas, row counts, source snapshots, and recent exact-response checksums.',
  datasetsTitle: 'Normalized Datasets',
  datasetsSubtitle: 'INDIVIDUAL EXPORTS',
  originalSource: 'Original source:',
  checksumGuidance: 'Checksum verification',
  checksumDesc: 'Compute SHA-256 over the exact downloaded CSV or ZIP bytes, then compare all 64 characters, filename, and byte size with its completed export-history record. The ZIP-internal manifest does not contain the final ZIP hash. The JSON manifest endpoint includes recent history, but may be downloaded before the current export finishes. Verification is manual.',
  checksumCommand: 'On Linux, run: sha256sum your-downloaded-file.csv (or .zip). On macOS: shasum -a 256 your-downloaded-file.csv (or .zip).',
  sourceHashScope: 'Original-file SHA-256 below describes a source archive on the server, not the normalized CSV or ZIP you download. Panel PNG/XLSX exports are separate and are not tracked in this history.',
  historyTitle: 'Recent Exports',
  historySubtitle: 'SYSTEM HISTORY',
  exportKind: 'Kind',
  exportStatus: 'Status',
  exportDate: 'Date',
  exportSize: 'Size',
  exportRows: 'Rows',
  statusCompleted: 'Completed',
  statusFailed: 'Failed',
  statusPending: 'Pending',
  licenseNote: 'License:',
  downloadCsv: 'Download CSV',
  downloadZip: 'Download ZIP',
  downloadJson: 'Download JSON',
  noHistory: 'No recent export history available.',
  loadingCatalog: 'Loading download catalog...',
  errorLoading: 'Failed to load download catalog. The service might be busy or temporarily unavailable due to high request volume.',
  retry: 'Retry',
  datasetStatusAvailable: 'Available',
  datasetStatusUnavailable: 'Unavailable',
  clinicalCaveat: 'IBCE normalized exports are research/reference assets derived from public layers. They must not be used for direct clinical decisions.',
  sourceLinkCaveat: 'Links to original sources provide the unnormalized upstream files. IBCE is not responsible for upstream availability.',
  backToDiscovery: 'Back to Discovery',
  bytes: 'bytes',
  dataAccess: 'DATA ACCESS',
  notice: 'Notice',
  zipArchive: 'ZIP archive',
  jsonManifest: 'JSON manifest and history',
  schema: 'Schema',
  columns: 'columns',
  originalSize: 'Original size',
  originalSha: 'Original SHA-256',
  rawFile: 'Original file',
  file: 'File',
  sha256: 'SHA-256',
  loadingHistory: 'Loading export history...',
  hpaLicense: 'Use and redistribution follow the published Human Protein Atlas terms.',
  tcgaLicense: 'Access and reuse follow the GDC portal and TCGA data-use terms.',
};

const downloadId = {
  downloadHeroTitle: 'Pusat Unduhan',
  downloadHeroDesc: 'Akses aman dan dapat diaudit ke dataset referensi IBCE ternormalisasi. Ini adalah ekspor penelitian yang diturunkan dari sumber publik, diformat untuk pipeline biologi komputasi, bukan untuk pengambilan keputusan klinis.',
  downloadPackage: 'Paket Lengkap',
  downloadPackageDesc: 'Arsip ZIP berisi enam CSV dataset ternormalisasi, README.txt, dan manifest.json, bila keenam lapisan memiliki baris data. Checksum respons ZIP yang selesai tercatat dalam riwayat ekspor.',
  packageUnavailable: 'ZIP lengkap memerlukan keenam dataset berisi baris data. Unduh CSV yang tersedia satu per satu atau periksa status ingest di Sumber Data.',
  downloadManifest: 'Manifes Data',
  downloadManifestDesc: 'Manifes JSON berisi skema saat ini, jumlah baris, snapshot sumber, dan checksum respons terbaru.',
  datasetsTitle: 'Dataset Ternormalisasi',
  datasetsSubtitle: 'EKSPOR INDIVIDUAL',
  originalSource: 'Sumber asli:',
  checksumGuidance: 'Verifikasi checksum',
  checksumDesc: 'Hitung SHA-256 dari bita CSV atau ZIP yang diunduh, lalu cocokkan seluruh 64 karakter, nama berkas, dan ukuran bita dengan rekaman ekspor berstatus selesai. Manifes di dalam ZIP tidak memuat hash akhir ZIP. Endpoint manifes JSON menyertakan riwayat terbaru, tetapi mungkin diunduh sebelum ekspor saat ini selesai. Verifikasi dilakukan secara manual.',
  checksumCommand: 'Di Linux, jalankan: sha256sum nama-berkas-unduhan.csv (atau .zip). Di macOS: shasum -a 256 nama-berkas-unduhan.csv (atau .zip).',
  sourceHashScope: 'SHA-256 berkas asli di bawah merujuk pada arsip sumber di server, bukan CSV ternormalisasi atau ZIP yang Anda unduh. Ekspor PNG/XLSX dari panel bersifat terpisah dan tidak tercatat dalam riwayat ini.',
  historyTitle: 'Ekspor Terbaru',
  historySubtitle: 'RIWAYAT SISTEM',
  exportKind: 'Jenis',
  exportStatus: 'Status',
  exportDate: 'Tanggal',
  exportSize: 'Ukuran',
  exportRows: 'Baris',
  statusCompleted: 'Selesai',
  statusFailed: 'Gagal',
  statusPending: 'Tertunda',
  licenseNote: 'Lisensi:',
  downloadCsv: 'Unduh CSV',
  downloadZip: 'Unduh ZIP',
  downloadJson: 'Unduh JSON',
  noHistory: 'Tidak ada riwayat ekspor terbaru.',
  loadingCatalog: 'Memuat katalog unduhan...',
  errorLoading: 'Gagal memuat katalog unduhan. Layanan mungkin sedang sibuk atau tidak tersedia sementara karena volume permintaan yang tinggi.',
  retry: 'Coba Lagi',
  datasetStatusAvailable: 'Tersedia',
  datasetStatusUnavailable: 'Tidak Tersedia',
  clinicalCaveat: 'Ekspor ternormalisasi IBCE adalah aset penelitian/referensi yang diturunkan dari lapisan publik. Ekspor ini tidak boleh digunakan untuk keputusan klinis langsung.',
  sourceLinkCaveat: 'Tautan ke sumber asli menyediakan berkas hulu yang belum dinormalisasi. IBCE tidak bertanggung jawab atas ketersediaan hulu.',
  backToDiscovery: 'Kembali ke Penemuan',
  bytes: 'bita',
  dataAccess: 'AKSES DATA',
  notice: 'Perhatian',
  zipArchive: 'Arsip ZIP',
  jsonManifest: 'Manifes JSON dan riwayat',
  schema: 'Skema',
  columns: 'kolom',
  originalSize: 'Ukuran sumber asli',
  originalSha: 'SHA-256 sumber asli',
  rawFile: 'Berkas sumber asli',
  file: 'Berkas',
  sha256: 'SHA-256',
  loadingHistory: 'Memuat riwayat ekspor...',
  hpaLicense: 'Penggunaan dan redistribusi mengikuti ketentuan Human Protein Atlas yang dipublikasikan.',
  tcgaLicense: 'Akses dan penggunaan kembali mengikuti portal GDC dan ketentuan penggunaan data TCGA.',
};

export default function IBCEDownloadCenter() {
  const [, setLoc] = useLocation();
  const { lang, t: sharedT } = useIbceLocale();
  const t = (key: keyof typeof downloadEn) => (lang === 'id' ? downloadId[key] : downloadEn[key]);

  const { data: catalogData, isLoading: catalogLoading, isError: catalogError, refetch: refetchCatalog } = useIbceDownloadCatalog();
  const { data: historyData, isLoading: historyLoading } = useIbceDownloadHistory({ query: { queryKey: getIbceDownloadHistoryQueryKey(), refetchInterval: 10000 } });
  const { data: manifestData, isLoading: manifestLoading } = useIbceDownloadManifest();
  const requiredDatasets = ['ihc', 'prognosis', 'cellline_meta', 'cellline_rna', 'patient_rna', 'clinical'];
  const packageReady = requiredDatasets.every(key =>
    catalogData?.datasets.some(ds => ds.key === key && ds.availability === 'available' && ds.rowCount > 0)
  );

  const formatBytes = (bytes: number | null) => {
    if (bytes === null) return '-';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString(lang === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const localizedLicense = (organization: string) =>
    organization.includes('Human Protein Atlas') ? t('hpaLicense') : t('tcgaLicense');

  return (
    <div className="ibce-wrap">
      <div className="ibce-page" style={{ maxWidth: 1200 }}>
        
        <button className="ibce-integrity-back" onClick={() => setLoc('/ibce')}>
          <ArrowLeft size={14} aria-hidden="true" />
          {sharedT('navigateBack')}
        </button>

        <section className="ibce-hero" style={{ padding: '20px 0 40px' }}>
          <div className="ibce-integrity-kicker">
            <ShieldCheck size={14} aria-hidden="true" />
            {t('dataAccess')}
          </div>
          <h1 className="ibce-integrity-title">{t('downloadHeroTitle')}</h1>
          <p className="ibce-integrity-intro">{t('downloadHeroDesc')}</p>
          
          <IbceSectionNav />
          
          <div className="ibce-limit-card" style={{ maxWidth: 780, marginTop: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <AlertCircle size={18} style={{ color: 'hsl(var(--destructive))', flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: 'hsl(var(--foreground))', display: 'block', marginBottom: 4 }}>{t('notice')}</strong>
              {t('clinicalCaveat')}
            </div>
          </div>
        </section>

        {catalogError ? (
          <div className="ibce-empty" style={{ textAlign: 'center', padding: 40 }}>
            <AlertCircle size={32} style={{ color: 'hsl(var(--destructive))', margin: '0 auto 16px' }} />
            <div style={{ marginBottom: 16 }}>{t('errorLoading')}</div>
            <button className="ibce-btn" onClick={() => refetchCatalog()}>{t('retry')}</button>
          </div>
        ) : catalogLoading ? (
          <div className="ibce-empty" style={{ textAlign: 'center', padding: 40 }}>
            <Database size={32} style={{ color: 'hsl(var(--primary))', margin: '0 auto 16px', opacity: 0.5 }} />
            <div className="ibce-muted">{t('loadingCatalog')}</div>
          </div>
        ) : (
          <>
            {/* Top Level Packages */}
            <div className="ibce-grid ibce-grid-2 ibce-download-package-grid" style={{ marginBottom: 48 }}>
              
              <div className="ibce-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="ibce-integrity-icon" style={{ background: 'hsl(var(--primary) / 0.1)', borderColor: 'hsl(var(--primary) / 0.2)' }}>
                    <FileArchive size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{t('downloadPackage')}</h2>
                    <div className="ibce-small ibce-muted">{t('zipArchive')}</div>
                  </div>
                </div>
                <p className="ibce-small ibce-muted" style={{ marginBottom: 24, flex: 1 }}>
                  {t('downloadPackageDesc')}
                </p>
                {packageReady ? (
                  <a href={getIbceDownloadPackageUrl()} className="ibce-card-action" style={{ width: '100%', textDecoration: 'none', padding: '14px 20px', fontSize: 14, boxShadow: '0 8px 20px hsl(var(--primary) / 0.25)' }}>
                    <Download size={16} />
                    {t('downloadZip')}
                  </a>
                ) : (
                  <div>
                    <p className="ibce-small ibce-muted" style={{ marginBottom: 12 }}>{t('packageUnavailable')}</p>
                    <span className="ibce-card-action" aria-disabled="true" style={{ opacity: 0.55 }}>
                      <Download size={16} />{t('downloadZip')}
                    </span>
                  </div>
                )}
              </div>

              <div className="ibce-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="ibce-integrity-icon" style={{ background: 'hsl(142 60% 45% / 0.1)', borderColor: 'hsl(142 60% 45% / 0.2)', color: 'hsl(142 60% 45%)' }}>
                    <FileJson size={20} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 20 }}>{t('downloadManifest')}</h2>
                    <div className="ibce-small ibce-muted">{t('jsonManifest')}</div>
                  </div>
                </div>
                <p className="ibce-small ibce-muted" style={{ marginBottom: 24, flex: 1 }}>
                  {t('downloadManifestDesc')}
                </p>
                {manifestLoading ? null : manifestData && (
                   <div style={{ background: 'hsl(var(--background))', padding: 8, borderRadius: 6, marginBottom: 16, border: '1px solid hsl(var(--border))', maxHeight: 80, overflow: 'hidden', position: 'relative', minWidth: 0 }}>
                     <pre className="ibce-mono ibce-small ibce-muted" style={{ margin: 0, fontSize: 10, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {JSON.stringify(manifestData, null, 2)}
                    </pre>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(transparent, hsl(var(--card)))' }} />
                  </div>
                )}
                <a href={getIbceDownloadManifestUrl()} className="ibce-card-action" style={{ width: '100%', background: 'hsl(var(--foreground))', color: 'hsl(var(--background))', textDecoration: 'none', padding: '14px 20px', fontSize: 14, boxShadow: '0 8px 20px hsl(var(--foreground) / 0.15)' }}>
                  <Download size={16} />
                  {t('downloadJson')}
                </a>
              </div>

            </div>

            {/* Individual Datasets */}
            <div className="ibce-section-title">
              <h2>{t('datasetsTitle')}</h2>
              <span>{t('datasetsSubtitle')}</span>
            </div>
            
            <p className="ibce-muted ibce-small" style={{ marginBottom: 20 }}>
              {t('sourceLinkCaveat')} {t('sourceHashScope')}
            </p>

            <div className="ibce-grid ibce-grid-2">
              {catalogData?.datasets.map((ds) => (
                <div key={ds.key} className="ibce-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 18, marginBottom: 0 }}>{localizedDatasetLabel(ds.key, ds.title, lang)}</h3>
                    <div className={`ibce-avail ${ds.availability === 'available' ? 'on' : ''}`}>
                      {ds.availability === 'available' ? t('datasetStatusAvailable') : t('datasetStatusUnavailable')}
                    </div>
                  </div>
                  
                  <p className="ibce-small ibce-muted" style={{ marginBottom: 16, lineHeight: 1.6 }}>
                     {localizedDatasetDescription(ds.key, ds.description, lang)}
                  </p>

                  <div style={{ background: 'hsl(var(--muted) / 0.3)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                      <div>
                        <div className="ibce-muted" style={{ marginBottom: 2 }}>{t('exportRows')}</div>
                        <div className="ibce-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>{ds.rowCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="ibce-muted" style={{ marginBottom: 2 }}>{t('schema')}</div>
                        <div className="ibce-mono" style={{ color: 'hsl(var(--foreground))' }}>{ds.tableSchema.length} {t('columns')}</div>
                      </div>
                    </div>
                    {ds.originalAttachedSource && (ds.originalAttachedSource.sha256 || ds.originalAttachedSource.sizeBytes) && (
                      <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 8, marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        {ds.originalAttachedSource.sizeBytes !== null && (
                          <div>
                            <div className="ibce-muted" style={{ marginBottom: 2 }}>{t('originalSize')}</div>
                            <div className="ibce-mono" style={{ color: 'hsl(var(--foreground))' }}>{formatBytes(ds.originalAttachedSource.sizeBytes)}</div>
                          </div>
                        )}
                        {ds.originalAttachedSource.sha256 && (
                          <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                            <div className="ibce-muted" style={{ marginBottom: 2 }}>{t('originalSha')}</div>
                            <div className="ibce-mono" style={{ color: 'hsl(var(--foreground))', overflowWrap: 'anywhere', lineHeight: 1.5 }} title={ds.originalAttachedSource.sha256}>
                              {ds.originalAttachedSource.sha256}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: 8, marginTop: 4 }}>
                      <div className="ibce-muted" style={{ marginBottom: 2 }}>{t('licenseNote')}</div>
                      <div>{localizedLicense(ds.sourceOrganization)}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20, flex: 1 }}>
                    <div className="ibce-muted ibce-small" style={{ marginBottom: 4 }}>{t('originalSource')}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <a href={ds.sourceDatasetUrl} target="_blank" rel="noopener noreferrer" className="ibce-integrity-source" style={{ margin: 0 }}>
                        {ds.sourceOrganization} <ExternalLink size={11} style={{ marginLeft: 4 }} />
                      </a>
                      {ds.sourceDirectFileUrl && (
                        <a href={ds.sourceDirectFileUrl} target="_blank" rel="noopener noreferrer" className="ibce-integrity-source" style={{ margin: 0 }}>
                          {t('rawFile')} <ExternalLink size={11} style={{ marginLeft: 4 }} />
                        </a>
                      )}
                    </div>
                  </div>

                  {ds.availability === 'available' ? (
                    <a
                      href={getIbceDownloadDatasetCsvUrl(ds.key)}
                      className="ibce-card-action"
                      style={{ textDecoration: 'none' }}
                    >
                      <Download size={14} />
                      {t('downloadCsv')}
                    </a>
                  ) : (
                    <span className="ibce-card-action" aria-disabled="true" style={{ opacity: 0.5 }}>
                      <Download size={14} />
                      {t('datasetStatusUnavailable')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="ibce-limit-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 24 }}>
              <ShieldCheck size={18} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: 'hsl(var(--foreground))', display: 'block', marginBottom: 4 }}>{t('checksumGuidance')}</strong>
                <p style={{ margin: '0 0 8px' }}>{t('checksumDesc')}</p>
                <code className="ibce-mono ibce-small" style={{ overflowWrap: 'anywhere' }}>{t('checksumCommand')}</code>
              </div>
            </div>

            {/* Export History */}
            <div className="ibce-section-title" style={{ marginTop: 48 }}>
              <h2>{t('historyTitle')}</h2>
              <span>{t('historySubtitle')}</span>
            </div>

            <div className="ibce-panel" style={{ padding: 0, overflow: 'hidden' }}>
              {historyLoading ? (
                <div style={{ padding: 32, textAlign: 'center' }} className="ibce-muted ibce-small">
                  {t('loadingHistory')}
                </div>
              ) : !historyData?.exports || historyData.exports.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center' }} className="ibce-muted ibce-small">
                  {t('noHistory')}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ibce-table">
                    <thead>
                      <tr>
                        <th>{t('exportDate')}</th>
                        <th>{t('exportKind')}</th>
                        <th>{t('file')}</th>
                        <th>{t('exportRows')}</th>
                        <th>{t('exportSize')}</th>
                        <th>{t('sha256')}</th>
                        <th>{t('exportStatus')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.exports.map(exp => (
                        <tr key={exp.id}>
                          <td className="ibce-small">{formatDate(exp.requestedAt)}</td>
                          <td>
                            <span className="ibce-class" style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                              {exp.exportKind}
                            </span>
                          </td>
                          <td className="ibce-mono ibce-small">{exp.filename}</td>
                          <td className="ibce-mono ibce-small">{exp.rows?.toLocaleString() || '-'}</td>
                          <td className="ibce-mono ibce-small">{formatBytes(exp.bytes)}</td>
                           <td className="ibce-mono ibce-small" style={{ overflowWrap: 'anywhere', minWidth: 180 }}>
                             {exp.sha256 ?? '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              {exp.status === 'completed' ? (
                                <><CheckCircle2 size={12} style={{ color: 'hsl(142 60% 45%)' }} /> {t('statusCompleted')}</>
                              ) : exp.status === 'failed' ? (
                                <><AlertCircle size={12} style={{ color: 'hsl(var(--destructive))' }} /> {t('statusFailed')}</>
                              ) : (
                                <><Clock size={12} style={{ color: 'hsl(var(--muted-foreground))' }} /> {t('statusPending')}</>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}

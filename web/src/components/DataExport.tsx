/**
 * Both endpoints send `Content-Disposition: attachment`, so plain anchor links
 * trigger a browser download — no fetch/blob juggling needed.
 */
export function DataExport() {
  return (
    <section className="data-export">
      <h2>Backup &amp; export</h2>
      <div className="export-buttons">
        <a className="export-button" href="/api/export" download>
          Download backup (JSON)
        </a>
        <a className="export-button" href="/api/export/expenses.csv" download>
          Export expenses (CSV)
        </a>
      </div>
    </section>
  );
}

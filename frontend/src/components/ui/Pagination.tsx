interface Props { page: number; pages: number; onPage: (p: number) => void; }

export default function Pagination({ page, pages, onPage }: Props) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center gap-2 mt-6 justify-end">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">← Prev</button>
      <span className="text-sm text-gray-500">Page {page} of {pages}</span>
      <button onClick={() => onPage(page + 1)} disabled={page === pages} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">Next →</button>
    </div>
  );
}

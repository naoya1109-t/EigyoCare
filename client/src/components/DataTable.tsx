import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
}

export interface DataTableTheme {
  border: string;
  header: string;
  oddRow: string;
  evenRow: string;
  rowHover: string;
}

const DEFAULT_THEME: DataTableTheme = {
  border: "border-slate-200",
  header: "bg-slate-50 text-slate-600",
  oddRow: "bg-white",
  evenRow: "bg-slate-50",
  rowHover: "hover:bg-slate-100",
};

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  theme?: Partial<DataTableTheme>;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "データがありません",
  theme,
}: DataTableProps<T>) {
  const t = { ...DEFAULT_THEME, ...theme };

  if (rows.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className={`overflow-x-auto rounded border ${t.border} bg-white`}>
      <table className="min-w-full text-sm">
        <thead className={t.header}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2 font-semibold ${col.align === "right" ? "text-right" : "text-left"}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row)} className={`${i % 2 === 1 ? t.evenRow : t.oddRow} ${t.rowHover}`}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2 ${col.align === "right" ? "text-right" : "text-left"}`}
                >
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

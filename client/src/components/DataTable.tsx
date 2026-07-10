import { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = "データがありません",
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return <p className="p-6 text-center text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2 font-semibold text-slate-600 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-slate-50">
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

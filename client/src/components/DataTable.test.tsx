import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataTable, { Column } from "./DataTable";

interface Row {
  id: number;
  name: string;
}

const columns: Column<Row>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "名前" },
];

describe("DataTable", () => {
  it("renders the empty message when there are no rows", () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} />);
    expect(screen.getByText("データがありません")).toBeInTheDocument();
  });

  it("renders a row per item using the column definitions", () => {
    const rows: Row[] = [
      { id: 1, name: "得意先A" },
      { id: 2, name: "得意先B" },
    ];
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getByText("得意先A")).toBeInTheDocument();
    expect(screen.getByText("得意先B")).toBeInTheDocument();
  });

  it("uses a column's custom render function when provided", () => {
    const customColumns: Column<Row>[] = [
      { key: "name", header: "名前", render: (row) => `カスタム:${row.name}` },
    ];
    render(<DataTable columns={customColumns} rows={[{ id: 1, name: "A" }]} rowKey={(r) => r.id} />);
    expect(screen.getByText("カスタム:A")).toBeInTheDocument();
  });
});

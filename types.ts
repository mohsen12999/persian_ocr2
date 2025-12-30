export interface TableRow {
  id: string;
  [key: string]: string | number;
}

export interface ExtractedData {
  columns: string[];
  rows: TableRow[];
}

export enum ColumnType {
  NAME = 'name',
  COW = 'cow',
  SHEEP = 'sheep',
  GOAT = 'goat',
  NONE = 'None'
}

export interface NameDbItem {
  id: number;
  name: string;
}

export interface ColumnMapping {
  columnId: string;
  type: ColumnType;
}

export interface ApiPayload {
  date: string;
  mappedData: Record<string, any>;
  rawRowData: TableRow;
}

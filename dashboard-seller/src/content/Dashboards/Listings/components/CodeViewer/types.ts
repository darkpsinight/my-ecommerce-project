export interface CodeObject {
  codeId?: string;
  code: string;
  soldStatus: string;
  soldAt?: string | Date;
}

export interface CodeViewerProps {
  codes: CodeObject[];
}

export interface CodeTableProps {
  currentCodes: CodeObject[];
  copySuccess: string | null;
  handleCopyCode: (code: string) => void;
}

export interface CodeViewerButtonProps {
  codes: CodeObject[];
  onClick: () => void;
}

export interface CodeSearchProps {
  searchTerm: string;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface CodePaginationProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

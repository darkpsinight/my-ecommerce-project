import { FC, useState, useEffect } from 'react';
import { 
  CodeViewerProps, 
  CodeObject 
} from './CodeViewer/types';
import CodeViewerButton from './CodeViewer/CodeViewerButton';
import CodeViewerDialog from './CodeViewer/CodeViewerDialog';

export const CodeViewer: FC<CodeViewerProps> = ({ codes }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [filteredCodes, setFilteredCodes] = useState<CodeObject[]>(codes);

  // Filter codes when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCodes(codes);
    } else {
      const filtered = codes.filter(codeObj => 
        codeObj.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCodes(filtered);
    }
    setPage(0); // Reset to first page when search changes
  }, [searchTerm, codes]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setCopySuccess(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopySuccess(code);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Get current page of codes
  const currentCodes = filteredCodes.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <>
      <CodeViewerButton 
        codes={codes} 
        onClick={handleOpenModal} 
      />
      
      <CodeViewerDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        filteredCodes={filteredCodes}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        currentCodes={currentCodes}
        copySuccess={copySuccess}
        handleCopyCode={handleCopyCode}
        page={page}
        rowsPerPage={rowsPerPage}
        handleChangePage={handleChangePage}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </>
  );
};

export default CodeViewer;

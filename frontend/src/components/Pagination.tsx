import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  onPrev,
  onNext,
  onPageSelect, 
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSelect: (page: number) => void;
}) {
  const [inputValue, setInputValue] = useState(page.toString());

  useEffect(() => {
    setInputValue(page.toString());
  }, [page]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleJumpToPage = () => {
    let newPage = parseInt(inputValue, 10);
    
    if (isNaN(newPage)) {
      setInputValue(page.toString());
      return;
    }

    if (newPage < 1) newPage = 1;
    if (newPage > totalPages) newPage = totalPages;

    setInputValue(newPage.toString());
    
    if (newPage !== page) {
      onPageSelect(newPage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className="pagination">
      <button
        className="pageBtn"
        onClick={onPrev}
        disabled={page <= 1}
        type="button"
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </button>
      
      <span className="pageInfo">
        Page{' '}
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleJumpToPage}     
          onKeyDown={handleKeyDown}     
          min={1}
          max={totalPages || 1}
          className="pageInput"
        />{' '}
        of <strong>{totalPages || 1}</strong>
      </span>
      
      <button
        className="pageBtn"
        onClick={onNext}
        disabled={page >= totalPages}
        type="button"
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
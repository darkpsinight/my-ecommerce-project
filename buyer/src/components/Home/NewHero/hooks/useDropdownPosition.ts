import { useState, useEffect, useCallback } from "react";
import { DropdownPosition } from "../types/SearchTypes";

export const useDropdownPosition = (
  showSuggestions: boolean,
  formRef: React.RefObject<HTMLFormElement>
) => {
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
    width: 0,
  });

  const updateDropdownPosition = useCallback(() => {
    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px gap
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [formRef]);

  useEffect(() => {
    if (showSuggestions) {
      updateDropdownPosition();

      const handleUpdate = () => updateDropdownPosition();
      window.addEventListener("scroll", handleUpdate);
      window.addEventListener("resize", handleUpdate);

      return () => {
        window.removeEventListener("scroll", handleUpdate);
        window.removeEventListener("resize", handleUpdate);
      };
    }
  }, [showSuggestions, updateDropdownPosition]);

  return { dropdownPosition, updateDropdownPosition };
};
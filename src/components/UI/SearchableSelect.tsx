import { useState, useRef, useEffect, useMemo, type KeyboardEvent } from "react";
import {
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  noOptionsMessage?: string;
  className?: string;
  id?: string;
}

/**
 * Normalizes Arabic text by removing diacritics and unifying alternate letter forms.
 */
const normalizeArabic = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "") // Diacritics (tashkeel)
    .replace(/[أإآٱ]/g, "ا") // Hamza variations
    .replace(/ة/g, "ه") // Taa Marbuta
    .replace(/[ىي]/g, "ي"); // Yaa & Alef Maksura
};

/**
 * Partial matching function supporting Arabic normalization & English case-insensitivity.
 */
const matchesQuery = (option: string, query: string): boolean => {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const normOption = normalizeArabic(option);
  const normQuery = normalizeArabic(trimmed);

  if (normOption.includes(normQuery)) return true;

  // Fallback direct case-insensitive check
  return option.toLowerCase().includes(trimmed.toLowerCase());
};

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "ابحث أو اختر...",
  label,
  disabled = false,
  required = false,
  noOptionsMessage = "لا توجد نتائج تطابق بحثك",
  className = "",
  id,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Clean and deduplicate options
  const cleanOptions = useMemo(() => {
    const set = new Set<string>();
    for (const opt of options) {
      const trimmed = opt?.trim();
      if (trimmed) set.add(trimmed);
    }
    return Array.from(set);
  }, [options]);

  // Filter options based on user typing
  const filteredOptions = useMemo(() => {
    if (!isTyping || !query.trim()) {
      return cleanOptions;
    }
    return cleanOptions.filter((opt) => matchesQuery(opt, query));
  }, [cleanOptions, isTyping, query]);

  // Scroll highlighted item into view smoothly
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setIsTyping(false);
        setQuery("");
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    if (!isTyping) {
      setQuery("");
      const currentIndex = cleanOptions.indexOf(value);
      setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (disabled) return;
    handleOpen();
    e.target.select();
  };

  const handleSelect = (option: string) => {
    onChange(option);
    setIsOpen(false);
    setIsTyping(false);
    setQuery("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    setIsTyping(false);
    setHighlightedIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      setIsTyping(false);
      setQuery("");
    } else {
      handleOpen();
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        handleOpen();
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredOptions.length === 0) return;
      setHighlightedIndex((prev) => {
        const next = prev + 1;
        return next >= filteredOptions.length ? 0 : next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredOptions.length === 0) return;
      setHighlightedIndex((prev) => {
        const next = prev - 1;
        return next < 0 ? filteredOptions.length - 1 : next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredOptions.length
      ) {
        handleSelect(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setIsTyping(false);
      setQuery("");
      setHighlightedIndex(-1);
    } else if (e.key === "Tab") {
      setIsOpen(false);
      setIsTyping(false);
      setQuery("");
      setHighlightedIndex(-1);
    }
  };

  // What is displayed in the input field
  const displayValue = isTyping ? query : value || "";
  const showClear = Boolean(value || (isTyping && query.trim()));

  return (
    <div ref={containerRef} className={`relative text-right ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-black text-slate-700"
        >
          {label}
          {required && <span className="mr-1 text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Search / Magnifying Glass Icon (Right side in RTL) */}
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <MagnifyingGlassIcon className="h-4 w-4" />
        </span>

        {/* Combobox Search / Input Field */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={handleFocus}
          onClick={handleOpen}
          onChange={(e) => {
            setIsTyping(true);
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-16 pr-10 text-sm font-bold text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {/* Action icons on the left side (RTL) */}
        <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {showClear && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="إلغاء الاختيار"
              aria-label="إلغاء الاختيار"
              tabIndex={-1}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            tabIndex={-1}
            onClick={handleToggle}
            aria-label="فتح القائمة"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 disabled:cursor-not-allowed"
          >
            <ChevronUpDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-indigo-600" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto overscroll-contain py-0.5 text-sm"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => {
                const isSelected = option === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={option}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex cursor-pointer select-none items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors ${
                      isSelected
                        ? "bg-indigo-50 font-black text-indigo-700"
                        : isHighlighted
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{option}</span>
                    {isSelected && (
                      <CheckIcon className="h-4 w-4 shrink-0 text-indigo-600" />
                    )}
                  </li>
                );
              })
            ) : (
              <li className="select-none py-6 text-center text-xs font-bold text-slate-400">
                {noOptionsMessage}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;

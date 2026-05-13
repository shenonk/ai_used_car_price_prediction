import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

function normalizeOption(option) {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  return {
    value: String(option?.value ?? ""),
    label: String(option?.label ?? option?.value ?? ""),
  };
}

export default function AppDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  icon: Icon,
  error = false,
  disabled = false,
  searchable = false,
  className = "",
}) {
  const normalizedOptions = useMemo(() => (options || []).map(normalizeOption), [options]);
  const currentValue = String(value ?? "");
  const selectedOption = normalizedOptions.find((option) => option.value === currentValue);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();

  const displayValue = searchable ? currentValue : selectedOption?.label || "";
  const visibleOptions = normalizedOptions;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const selectedIndex = Math.max(
      visibleOptions.findIndex((option) => option.value === currentValue),
      0
    );
    setActiveIndex(selectedIndex);
  }, [currentValue, isOpen, visibleOptions]);

  useEffect(() => {
    if (!isOpen) return;

    const activeElement = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, isOpen]);

  const selectOption = (option) => {
    if (!option || disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const moveActiveIndex = (direction) => {
    if (visibleOptions.length === 0) return;
    setActiveIndex((current) => {
      const next = current + direction;
      if (next < 0) return visibleOptions.length - 1;
      if (next >= visibleOptions.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!isOpen && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(visibleOptions.length - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      selectOption(visibleOptions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  const controlClasses = [
    "app-dropdown__control",
    error ? "app-dropdown__control--error" : "",
    disabled ? "app-dropdown__control--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={`app-dropdown ${className}`}>
      {label && (
        <label className="app-dropdown__label">
          {Icon && <Icon className="app-dropdown__label-icon" />}
          <span>{label}</span>
        </label>
      )}

      <div className="app-dropdown__wrap">
        {searchable ? (
          <input
            className={controlClasses}
            value={displayValue}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            type="button"
            className={controlClasses}
            disabled={disabled}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            onClick={() => setIsOpen((current) => !current)}
            onKeyDown={handleKeyDown}
          >
            <span className={selectedOption ? "app-dropdown__value" : "app-dropdown__placeholder"}>
              {selectedOption?.label || placeholder}
            </span>
          </button>
        )}
        <ChevronDown className={`app-dropdown__chevron ${isOpen ? "app-dropdown__chevron--open" : ""}`} />

        {isOpen && !disabled && (
          <div ref={listRef} id={listboxId} className="app-dropdown__menu" role="listbox">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option, index) => (
                <button
                  key={`${option.value}-${index}`}
                  type="button"
                  data-index={index}
                  className={`app-dropdown__option ${
                    index === activeIndex ? "app-dropdown__option--active" : ""
                  } ${option.value === currentValue ? "app-dropdown__option--selected" : ""}`}
                  role="option"
                  aria-selected={option.value === currentValue}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="app-dropdown__empty">No options</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';

interface CatalogSelectProps {
  value: string;
  options: readonly string[];
  placeholder: string;
  onChange: (value: string) => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  optionLabels?: Readonly<Record<string, string>>;
  optionGroups?: Readonly<Record<string, string>>;
}

const CATALOG_OPEN_EVENT = 'filora:catalog-open';

export function CatalogSelect({
  value,
  options,
  placeholder,
  onChange,
  allowCustom = true,
  customPlaceholder = 'Ajouter une valeur…',
  disabled = false,
  ariaLabel,
  optionLabels = {},
  optionGroups = {},
}: CatalogSelectProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectId = useId();
  const [query, setQuery] = useState('');
  const [customValue, setCustomValue] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr-FR');
    if (!normalized) return options;
    return options.filter((option) => {
      const label = optionLabels[option] ?? option;
      const group = optionGroups[option] ?? '';
      return `${label} ${option} ${group}`.toLocaleLowerCase('fr-FR').includes(normalized);
    });
  }, [optionGroups, optionLabels, options, query]);

  useEffect(() => {
    function closeWhenAnotherCatalogOpens(event: Event) {
      const sourceId = (event as CustomEvent<string>).detail;
      if (sourceId !== selectId) detailsRef.current?.removeAttribute('open');
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const details = detailsRef.current;
      if (!details?.open) return;
      if (event.target instanceof Node && !details.contains(event.target)) {
        details.removeAttribute('open');
      }
    }

    window.addEventListener(CATALOG_OPEN_EVENT, closeWhenAnotherCatalogOpens as EventListener);
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => {
      window.removeEventListener(CATALOG_OPEN_EVENT, closeWhenAnotherCatalogOpens as EventListener);
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
    };
  }, [selectId]);

  function choose(next: string) {
    onChange(next);
    setQuery('');
    detailsRef.current?.removeAttribute('open');
  }

  function addCustom() {
    const next = customValue.trim();
    if (!next) return;
    choose(next);
    setCustomValue('');
  }

  function announceOpen() {
    if (detailsRef.current?.open) {
      window.dispatchEvent(new CustomEvent<string>(CATALOG_OPEN_EVENT, { detail: selectId }));
    }
  }

  return (
    <details
      className={`catalog-select${disabled ? ' is-disabled' : ''}`}
      ref={detailsRef}
      onToggle={announceOpen}
    >
      <summary aria-label={ariaLabel} aria-disabled={disabled} onClick={(event) => { if (disabled) event.preventDefault(); }}>
        <span className={value ? '' : 'catalog-placeholder'}>{value ? optionLabels[value] ?? value : placeholder}</span>
        <span
          aria-hidden="true"
          style={{ width: 16, height: 16, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}
        >
          <svg width="14" height="8" viewBox="0 0 14 8" aria-hidden="true">
            <path
              d="M2 1.5 7 6.5 12 1.5"
              fill="none"
              stroke="#97a9bf"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </summary>
      {!disabled ? (
        <div className="catalog-popover" onClick={(event) => event.stopPropagation()}>
          <input
            className="catalog-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher…"
            autoComplete="off"
          />
          <div className="catalog-options" role="listbox" aria-label={ariaLabel ?? placeholder}>
            {filtered.length ? filtered.map((option, index) => {
              const group = optionGroups[option] ?? '';
              const previousGroup = index > 0 ? optionGroups[filtered[index - 1]!] ?? '' : '';
              return (
                <Fragment key={option}>
                  {group && group !== previousGroup ? <span className="catalog-group-label">{group}</span> : null}
                  <button
                    type="button"
                    className={option === value ? 'selected' : ''}
                    onClick={() => choose(option)}
                    role="option"
                    aria-selected={option === value}
                  >
                    {optionLabels[option] ?? option}
                  </button>
                </Fragment>
              );
            }) : <span className="catalog-empty">Aucune proposition</span>}
          </div>
          {allowCustom ? (
            <div className="catalog-custom">
              <input
                value={customValue}
                onChange={(event) => setCustomValue(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } }}
                placeholder={customPlaceholder}
                autoComplete="off"
              />
              <button type="button" onClick={addCustom} disabled={!customValue.trim()}>Ajouter</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}

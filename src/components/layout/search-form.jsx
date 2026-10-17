'use client';

import { SearchIcon } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { SidebarInput } from '@/components/ui/sidebar';

const SearchForm = ({
  label = 'Buscar',
  placeholder = 'Buscar...',
  value,
  onChange,
  id = 'search',
  className,
  onSubmit = (e) => e.preventDefault(),
  ...props
}) => {
  return (
    <form onSubmit={onSubmit} className={className} {...props}>
      <div className="relative">
        <Label htmlFor={id} className="sr-only">
          {label}
        </Label>
        <SidebarInput
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-8 pl-7"
        />
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
      </div>
    </form>
  );
};

export default SearchForm;

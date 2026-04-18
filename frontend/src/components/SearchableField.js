import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

const SearchableField = ({
  value,
  onChange,
  options = [],
  label,
  placeholder,
  helperText,
  fullWidth = true,
}) => {
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || null}
      inputValue={inputValue}
      fullWidth={fullWidth}
      onInputChange={(_, nextInputValue, reason) => {
        if (reason === 'reset') return;
        setInputValue(nextInputValue);
        onChange(nextInputValue);
      }}
      onChange={(_, nextValue) => {
        const next = typeof nextValue === 'string' ? nextValue : nextValue || '';
        setInputValue(next);
        onChange(next);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          fullWidth={fullWidth}
        />
      )}
    />
  );
};

export default SearchableField;

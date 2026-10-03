import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

export function FormField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <TextField fullWidth label={label} type={props.type} required={props.required} value={props.value} placeholder={props.placeholder} slotProps={{ htmlInput: { minLength: props.minLength, maxLength: props.maxLength } }} onChange={props.onChange} onBlur={props.onBlur} disabled={props.disabled} />;
}
export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <TextField fullWidth multiline minRows={4} label={label} required={props.required} value={props.value} placeholder={props.placeholder} onChange={props.onChange} onBlur={props.onBlur} disabled={props.disabled} />;
}
export function SelectField({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  const accessibleLabel = label || props['aria-label'] || 'Select option';
  return <FormControl fullWidth size="small"><InputLabel>{accessibleLabel}</InputLabel><Select label={accessibleLabel} value={props.value ?? ''} onChange={props.onChange as never}>{Children.toArray(children).map((child) => { if (!isValidElement(child)) return null; const option = child.props as { value?: string | number; children?: ReactNode }; return option.value === undefined ? null : <MenuItem key={String(option.value)} value={option.value}>{option.children}</MenuItem>; })}</Select></FormControl>;
}

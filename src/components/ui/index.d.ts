
declare module '@ui' {
  import { FC, HTMLAttributes, InputHTMLAttributes, ReactNode, RefAttributes } from 'react';
  
  
  export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'error' | 'warning' | 'info' | 'success';
    title?: string;
    description?: string;
  }
  export const Alert: FC<AlertProps>;
  
  
  export interface BadgeProps {
    color?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
    text: string;
    className?: string;
  }
  export const Badge: FC<BadgeProps>;
  
  
  export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
  }
  export const Button: FC<ButtonProps>;
  
  
  export interface CardProps extends HTMLAttributes<HTMLDivElement> {}
  export const Card: FC<CardProps>;
  
  
  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
  }
  export const Input: FC<InputProps>;
  
  
  export interface SpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: 'default' | 'primary' | 'secondary' | 'white';
  }
  export const Spinner: FC<SpinnerProps>;
  
  
  export interface TableProps extends HTMLAttributes<HTMLTableElement> {}
  
  interface TableComponent extends FC<TableProps> {
    Header: FC<HTMLAttributes<HTMLTableSectionElement>>;
    Body: FC<HTMLAttributes<HTMLTableSectionElement>>;
    Footer: FC<HTMLAttributes<HTMLTableSectionElement>>;
    Row: FC<HTMLAttributes<HTMLTableRowElement>>;
    Cell: FC<HTMLAttributes<HTMLTableCellElement>>;
    HeaderCell: FC<HTMLAttributes<HTMLTableCellElement>>;
  }
  
  export const Table: TableComponent;
  
  
  export interface ThemeToggleProps extends HTMLAttributes<HTMLButtonElement> {}
  export const ThemeToggle: FC<ThemeToggleProps>;
}

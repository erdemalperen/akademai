import React from 'react';
import { cn } from '../../lib/utils';


interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn(
          'w-full caption-bottom text-sm',
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';


interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-gray-50 dark:bg-gray-800', className)} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';


interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('divide-y divide-gray-200 dark:divide-gray-700', className)}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';


interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';


interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  )
);
TableHeaderCell.displayName = 'TableHeaderCell';


interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-4 py-3 text-sm text-gray-900 dark:text-gray-100', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';


interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';


type TableComponent = React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>> & {
  Header: typeof TableHeader;
  Body: typeof TableBody;
  Footer: typeof TableFooter;
  Row: typeof TableRow;
  Cell: typeof TableCell;
  HeaderCell: typeof TableHeaderCell;
};


const TableWithComponents = Table as TableComponent;
TableWithComponents.Header = TableHeader;
TableWithComponents.Body = TableBody;
TableWithComponents.Footer = TableFooter;
TableWithComponents.Row = TableRow;
TableWithComponents.Cell = TableCell;
TableWithComponents.HeaderCell = TableHeaderCell;


export {
  TableWithComponents as Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableCell,
  TableHeaderCell,
};

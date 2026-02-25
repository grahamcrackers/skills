---
name: tanstack-table
description: TanStack Table v8 patterns for building headless, type-safe tables in React with sorting, filtering, pagination, and virtualization. Use when building data tables, grids, or list views, or when the user asks about TanStack Table, React Table, column definitions, or table state management.
---

# TanStack Table v8 Best Practices

## Core Concepts

TanStack Table is **headless** — it provides table logic and state, not UI. You bring your own markup and styling. This means full control over rendering with zero style conflicts.

## Basic Setup

```tsx
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

function UsersTable({ data }: { data: User[] }) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <table>
            <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                            <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
```

## Column Definitions

Define columns outside the component or memoize them to prevent infinite re-renders:

```tsx
const columnHelper = createColumnHelper<User>();

const columns = [
    columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
        header: "Email",
    }),
    columnHelper.accessor("role", {
        header: "Role",
        cell: (info) => <Badge>{info.getValue()}</Badge>,
        filterFn: "equalsString",
    }),
    columnHelper.accessor("createdAt", {
        header: "Created",
        cell: (info) => formatDate(info.getValue()),
        sortingFn: "datetime",
    }),
    columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => <RowActions user={row.original} />,
    }),
];
```

- Use `columnHelper` for type-safe column definitions.
- `accessor` columns map to data fields with automatic type inference.
- `display` columns are for UI-only elements (actions, checkboxes, expand toggles).

## Data Stability

Data must have a **stable reference**. Passing a new array on every render causes infinite re-renders:

```tsx
// Stable via useState
const [data, setData] = useState<User[]>([]);

// Stable via useMemo
const data = useMemo(() => transformRawData(rawData), [rawData]);

// Stable via TanStack Query (recommended)
const { data = [] } = useUsers();
```

## Sorting

```tsx
const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
});
```

Toggle sorting on headers:

```tsx
<th
    onClick={header.column.getToggleSortingHandler()}
    style={{ cursor: header.column.getCanSort() ? "pointer" : "default" }}
>
    {flexRender(header.column.columnDef.header, header.getContext())}
    {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? null}
</th>
```

## Filtering

### Column Filters

```tsx
const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
});
```

### Global Filter

```tsx
const table = useReactTable({
    // ...
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
});
```

### Custom Filter Functions

```tsx
const columns = [
    columnHelper.accessor("price", {
        filterFn: (row, columnId, filterValue) => {
            const price = row.getValue<number>(columnId);
            const { min, max } = filterValue as { min: number; max: number };
            return price >= min && price <= max;
        },
    }),
];
```

## Pagination

```tsx
const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
});

// Controls
table.getCanPreviousPage();
table.getCanNextPage();
table.previousPage();
table.nextPage();
table.setPageIndex(0);
table.setPageSize(20);
table.getPageCount();
```

## Server-Side Operations

For large datasets, handle sorting/filtering/pagination on the server:

```tsx
const table = useReactTable({
    data: serverData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    state: { pagination, sorting, columnFilters },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
});
```

Pass the state to your API query (pairs well with TanStack Query):

```tsx
const { data } = useQuery({
    queryKey: ["users", pagination, sorting, columnFilters],
    queryFn: () => fetchUsers({ pagination, sorting, filters: columnFilters }),
});
```

## Row Selection

```tsx
const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    // enableMultiRowSelection: false, // single-select mode
});

// Checkbox column
columnHelper.display({
    id: "select",
    header: ({ table }) => (
        <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
        />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
});
```

## Column Visibility

```tsx
const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
});

// Toggle UI
table.getAllLeafColumns().map((column) => (
    <label key={column.id}>
        <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
        {column.id}
    </label>
));
```

## Virtualization

For tables with thousands of rows, combine with `@tanstack/react-virtual`:

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 48,
    overscan: 10,
});
```

Render only the visible rows within a scrollable container.

## Patterns

- **Wrap in a custom hook** — encapsulate table state and configuration in a `useUsersTable(data)` hook.
- **Extract filter/pagination UI** — build reusable `TablePagination`, `TableFilter`, and `ColumnToggle` components that accept the table instance.
- **Type your row data** — always define `TData` and pass it as a generic to `createColumnHelper<TData>()`.
- **Stable column definitions** — define columns at module scope or memoize with `useMemo`. Never define them inline in the render body.

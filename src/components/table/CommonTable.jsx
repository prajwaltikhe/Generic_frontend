import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Table, TableBody, TableCell, TableContainer, TableSortLabel } from '@mui/material';
import { TableHead, TableRow, Paper, TablePagination, CircularProgress } from '@mui/material';

const isActionColumn = (col) =>
  typeof col.key === 'string' && ['action', 'actions', 'Action', 'Actions'].includes(col.key);

const CommonTable = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  totalCount = 0,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  loading = false,
  ...restProps
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  const handleSort = (columnKey) => {
    const isAsc = orderBy === columnKey && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnKey);
  };

  const sortedData = [...data].sort((a, b) => {
    if (!orderBy) return 0;
    const valueA = a[orderBy];
    const valueB = b[orderBy];
    if (typeof valueA === 'string') {
      return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return order === 'asc' ? valueA - valueB : valueB - valueA;
  });

  const actionColumns = columns.filter(isActionColumn);
  const nonActionColumns = columns.filter((col) => !isActionColumn(col));
  const hasAnyAction = !!onView || !!onEdit || !!onDelete || actionColumns.length > 0;
  const actionRenderers = actionColumns.map((col) => col.render).filter(Boolean);
  const actionHandlers = { ...restProps, onEdit, onDelete, onView };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ my: 2 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              {nonActionColumns.map((col, i) => (
                <TableCell
                  className='whitespace-nowrap'
                  key={i}
                  align={col.align || 'left'}
                  sx={{ fontWeight: 'bold' }}>
                  <TableSortLabel
                    active={orderBy === col.key}
                    direction={orderBy === col.key ? order : 'asc'}
                    onClick={() => handleSort(col.key)}>
                    {col.header}
                  </TableSortLabel>
                </TableCell>
              ))}
              {hasAnyAction && (
                <TableCell className='whitespace-nowrap' align='center' sx={{ fontWeight: 'bold' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={nonActionColumns.length + 1} align='center'>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : sortedData.length > 0 ? (
              sortedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {nonActionColumns.map((col, colIndex) => (
                    <TableCell className='whitespace-nowrap' key={colIndex} align={col.align || 'left'}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </TableCell>
                  ))}
                  {hasAnyAction && (
                    <TableCell align='center' sx={{ display: 'flex', gap: 2, p: 2, justifyContent: 'center' }}>
                      {actionRenderers.map((render, idx) =>
                        render ? <span key={idx}>{render(undefined, row, actionHandlers)}</span> : null
                      )}
                      {onView && (
                        <button
                          className='bg-blue-400 p-2 text-white rounded-[3px] w-5 h-4 cursor-pointer flex justify-center items-center'
                          onClick={() => onView(row)}
                          style={{ minWidth: 24, minHeight: 24 }}>
                          <RemoveRedEyeIcon fontSize='10px' />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          className='bg-green-400 p-2 text-white rounded-[3px] w-5 h-4 cursor-pointer flex justify-center items-center'
                          onClick={() => onEdit(row)}
                          style={{ minWidth: 24, minHeight: 24 }}>
                          <EditIcon fontSize='10px' />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className='bg-red-400 p-2 text-white rounded-[3px] w-5 h-4 cursor-pointer flex justify-center items-center'
                          onClick={() => onDelete(row)}
                          style={{ minWidth: 24, minHeight: 24 }}>
                          <DeleteIcon fontSize='10px' />
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={nonActionColumns.length + 1}>
                  <p className='text-center text-gray-500 py-6'>No Data Available!</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 15, 20, 25, 30]}
        component='div'
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(event) => {
          onRowsPerPageChange(parseInt(event.target.value));
        }}
      />
    </Paper>
  );
};

export default CommonTable;

import { useState } from 'react';
import CommonSearch from '../CommonSearch';
import { Table, TableBody, TableCell, TableContainer, TableHead } from '@mui/material';
import { TableRow, TableSortLabel, TablePagination, Paper, CircularProgress } from '@mui/material';

const getHeaderMinWidth = (header) => Math.max(80, Math.min(320, header.length * 9 + 24));

const headerCellSx = (header) => ({
  fontWeight: 'bold',
  fontSize: '1rem',
  px: 2,
  py: 1.5,
  background: '#FAFAFA',
  borderBottom: '1px solid #e0e0e0',
  height: 40,
  whiteSpace: 'nowrap',
  minWidth: getHeaderMinWidth(header),
  maxWidth: 400,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});
const bodyCellSx = (isFirst) => ({
  fontWeight: isFirst ? 500 : 400,
  fontSize: '1rem',
  px: 1.5,
  py: 1,
  height: 36,
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const ReportTable = ({
  columns,
  data,
  loading,
  error,
  page,
  setPage,
  limit,
  setLimit,
  searchQuery,
  setSearchQuery,
  limitOptions,
  totalCount = 0,
}) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');

  let sortedData = [...data];
  if (orderBy) {
    sortedData.sort((a, b) => {
      const va = a[orderBy],
        vb = b[orderBy];
      if (typeof va === 'string') return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return order === 'asc' ? va - vb : vb - va;
    });
  }

  let validLimits =
    Array.isArray(limitOptions) && limitOptions.length
      ? [...new Set(limitOptions.filter((v) => typeof v === 'number' && v > 0))]
      : [10, 25, 50, 100];
  if (typeof limit === 'number' && !validLimits.includes(limit)) validLimits.push(limit);
  validLimits.sort((a, b) => a - b);
  const safeLimit = validLimits.includes(limit) ? limit : validLimits[0];

  return (
    <div className='bg-white rounded-sm border-t-3 border-[#07163d] mt-4 pb-4 max-h-full h-fit'>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {typeof setSearchQuery === 'function' && (
          <div className='p-3 pb-0'>
            <CommonSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          </div>
        )}
        <TableContainer sx={{ maxHeight: 720, overflowX: 'auto' }}>
          <Table stickyHeader size='medium'>
            <TableHead>
              <TableRow sx={{ height: 40 }}>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align || 'left'} sx={headerCellSx(col.header)}>
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? order : 'asc'}
                      onClick={() => {
                        const isAsc = orderBy === col.key && order === 'asc';
                        setOrder(isAsc ? 'desc' : 'asc');
                        setOrderBy(col.key);
                      }}>
                      {col.header}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow sx={{ height: 36 }}>
                  <TableCell colSpan={columns.length} align='center' sx={{ height: 60 }}>
                    <CircularProgress size={28} className='my-2' />
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow sx={{ height: 36 }}>
                  <TableCell colSpan={columns.length} align='center' sx={{ height: 60 }}>
                    No data found
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow sx={{ height: 36 }}>
                  <TableCell colSpan={columns.length} align='center' sx={{ height: 60, color: 'red' }}>
                    {typeof error === 'string' ? error : 'An error occurred.'}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, rowIndex) => (
                  <TableRow key={row.id || rowIndex} hover sx={{ height: 36 }}>
                    {columns.map((col, colIdx) => (
                      <TableCell key={col.key} align={col.align || 'left'} sx={bodyCellSx(colIdx === 0)}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={validLimits}
          component='div'
          count={totalCount}
          rowsPerPage={safeLimit}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
        />
      </Paper>
    </div>
  );
};

export default ReportTable;

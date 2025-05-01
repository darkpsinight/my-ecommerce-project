import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  alpha,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { Listing } from '../../../../types';
import { formatDate } from '../../utils/formatters';

interface CodesTabProps {
  listing: Listing;
  activeCodes: number;
  totalCodes: number;
  copiedCode: string | null;
  handleCopyCode: (code: string) => void;
}

const CodesTab: React.FC<CodesTabProps> = ({
  listing,
  activeCodes,
  totalCodes,
  copiedCode,
  handleCopyCode
}) => {
  const theme = useTheme();

  return (
    <Card variant="outlined" sx={{ boxShadow: theme.shadows[1] }}>
      <CardContent sx={{ pb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2,
            alignItems: 'center'
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CodeIcon
              sx={{
                mr: 1,
                color: theme.palette.primary.main,
                fontSize: 20
              }}
            />
            Product Codes
          </Typography>

          <Chip
            label={`${activeCodes} Active / ${totalCodes} Total`}
            color={activeCodes > 0 ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 500 }}
          />
        </Box>

        <TableContainer
          sx={{
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`,
            maxHeight: 300
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      0.05
                    )
                  }}
                >
                  Code
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      0.05
                    )
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      0.05
                    )
                  }}
                >
                  Sold Date
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      0.05
                    )
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listing.codes &&
                listing.codes.map((codeItem, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:nth-of-type(odd)': {
                        backgroundColor: alpha(
                          theme.palette.background.default,
                          0.5
                        )
                      },
                      '&:hover': {
                        backgroundColor: alpha(
                          theme.palette.primary.main,
                          0.02
                        )
                      }
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontFamily="monospace"
                        sx={{ fontWeight: 500 }}
                      >
                        {codeItem.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={codeItem.soldStatus}
                        size="small"
                        color={
                          codeItem.soldStatus === 'active'
                            ? 'success'
                            : codeItem.soldStatus === 'sold'
                            ? 'primary'
                            : 'default'
                        }
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {codeItem.soldAt
                          ? formatDate(codeItem.soldAt)
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Copy Code">
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleCopyCode(codeItem.code)
                          }
                          color={
                            copiedCode === codeItem.code
                              ? 'success'
                              : 'default'
                          }
                        >
                          {copiedCode === codeItem.code ? (
                            <CheckCircleOutlineIcon fontSize="small" />
                          ) : (
                            <ContentCopyIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default CodesTab;

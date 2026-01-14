import { FC, useState, useEffect, ChangeEvent } from 'react';
import {
    Card,
    CardHeader,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    Tooltip,
    Typography,
    IconButton
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Label from 'src/components/Label';
import axios from '../../../utils/axios';
import { formatCurrencyMinor, formatDateTime } from '../../../utils/intl';

interface PayoutHistory {
    payoutId: string;
    amount: number;
    currency: string;
    status: string;
    initiatedAt: string;
    processedAt: string | null;
    failureCode: string | null;
    failureMessage: string | null;
}

interface PayoutsResponse {
    data: PayoutHistory[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

const getStatusLabel = (status: string): JSX.Element => {
    const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary'> = {
        COMPLETED: 'success',
        PENDING: 'warning',
        PROCESSING: 'info',
        FAILED: 'error',
        CANCELLED: 'error'
    };

    const color = map[status] || 'primary';
    return <Label color={color}>{status}</Label>;
};

const PayoutsList: FC = () => {
    const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
    const [page, setPage] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchPayouts = async () => {
            setLoading(true);
            try {
                const response = await axios.get<PayoutsResponse>('/seller/payouts', {
                    params: {
                        page: page + 1,
                        limit
                    }
                });
                setPayouts(response.data.data);
                setTotal(response.data.pagination.total);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayouts();
    }, [page, limit]);

    const handlePageChange = (_event: any, newPage: number) => {
        setPage(newPage);
    };

    const handleLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLimit(parseInt(event.target.value));
        setPage(0);
    };

    return (
        <Card>
            <CardHeader title="Payout History" />
            <Divider />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Payout ID</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Info</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">Loading...</TableCell>
                            </TableRow>
                        ) : payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No payouts found.</TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout.payoutId} hover>
                                    <TableCell>
                                        <Typography variant="body2" color="text.primary">
                                            {formatDateTime(payout.initiatedAt)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontFamily="monospace">
                                            {payout.payoutId.substring(0, 8)}...
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            {formatCurrencyMinor(payout.amount, payout.currency)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusLabel(payout.status)}
                                    </TableCell>
                                    <TableCell>
                                        {payout.status === 'FAILED' && payout.failureMessage ? (
                                            <Tooltip title={`Failed: ${payout.failureMessage}`}>
                                                <IconButton color="error" size="small">
                                                    <ErrorOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">-</Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
            <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={limit}
                onRowsPerPageChange={handleLimitChange}
                rowsPerPageOptions={[5, 10, 25]}
            />
        </Card>
    );
};

export default PayoutsList;

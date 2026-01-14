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
    useTheme,
    IconButton
} from '@mui/material';
import HelpOutlineTwoToneIcon from '@mui/icons-material/HelpOutlineTwoTone';
import Label from 'src/components/Label';
import axios from '../../../utils/axios';
import { formatCurrencyMajor, formatDateTime } from 'src/utils/intl';

interface OrderFinancial {
    orderId: string;
    orderDate: string;
    totalAmount: number;
    currency: string;
    escrowStatus: string;
    eligibilityStatus: string;
    holdReleaseDate: string | null;
    holdReasonCode: string;
    holdReasonText: string | null;
    payoutId: string | null;
    payoutStatus: string | null;
}

interface FinancialsResponse {
    data: OrderFinancial[];
    pagination: {
        total: number;
        page: number;
        pages: number;
    };
}

const getStatusLabel = (status: string, holdCode: string): JSX.Element => {
    if (status === 'released') {
        return <Label color="success">Payable</Label>;
    }
    if (status === 'refunded') {
        return <Label color="error">Refunded</Label>;
    }
    if (status === 'held') {
        return (
            <Tooltip title={holdCode !== 'NONE' ? holdCode : 'Funds held in escrow'}>
                <Label color="warning">On Hold</Label>
            </Tooltip>
        );
    }
    return <Label color="primary">{status}</Label>;
};

const OrdersFinancialList: FC = () => {
    const [orders, setOrders] = useState<OrderFinancial[]>([]);
    const [page, setPage] = useState<number>(0); // MUI is 0-indexed
    const [limit, setLimit] = useState<number>(10);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const theme = useTheme();

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const response = await axios.get<FinancialsResponse>('/seller/orders/financials', {
                    params: {
                        page: page + 1, // Backend is 1-indexed
                        limit
                    }
                });
                setOrders(response.data.data);
                setTotal(response.data.pagination.total);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
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
            <CardHeader title="Order Financials" />
            <Divider />
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Hold / Info</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">Loading...</TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No orders found.</TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.orderId} hover>
                                    <TableCell>
                                        <Typography variant="body2" color="text.primary">
                                            {formatDateTime(order.orderDate)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body1" fontWeight="bold">
                                            {order.orderId}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {order.escrowStatus === 'refunded' ? (
                                            <Tooltip title="Order was refunded. No earnings recorded." arrow>
                                                <Typography variant="body1" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                                                    —
                                                </Typography>
                                            </Tooltip>
                                        ) : (
                                            <Typography variant="body1" fontWeight="bold">
                                                {formatCurrencyMajor(order.totalAmount, order.currency)}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusLabel(order.escrowStatus, order.holdReasonCode)}
                                    </TableCell>
                                    <TableCell>
                                        {order.holdReasonText ? (
                                            <Tooltip title={order.holdReasonText} arrow>
                                                <IconButton color="secondary" size="small">
                                                    <HelpOutlineTwoToneIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        ) : order.payoutStatus ? (
                                            <Label color="info">Held in Escrow</Label>
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

export default OrdersFinancialList;

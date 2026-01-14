import { FC, useState, useEffect } from 'react';
import { Card, Grid, Typography, CardContent, Divider, Tooltip, IconButton, Box, useTheme } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import axios from '../../../utils/axios';
import { formatCurrencyMinor } from '../../../utils/intl';

interface Balance {
    currency: string;
    available_amount: number;
    pending_amount: number;
    total_paid_out: number;
    lifetime_gross_earned: number;
    lifetime_refunded: number;
    lifetime_net_earned: number;
}

const BalanceDisplay: FC = () => {
    const theme = useTheme();
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                const response = await axios.get<{ balances: Balance[] }>('/seller/balance');
                setBalances(response.data.balances || []);
            } catch (err) {
                console.error(err);
                setError('Failed to load balance information.');
            } finally {
                setLoading(false);
            }
        };

        fetchBalances();
    }, []);

    if (loading) {
        return (
            <Grid container spacing={3}>
                {[1, 2].map((i) => (
                    <Grid item xs={12} md={6} key={i}>
                        <Card sx={{ p: 2, height: '100%' }}>
                            <Typography variant="h4" sx={{ color: theme.palette.text.secondary }}>Loading...</Typography>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    }

    if (error) {
        return (
            <Card sx={{ p: 2 }}>
                <Typography color="error">{error}</Typography>
            </Card>
        );
    }

    if (!balances.length) {
        return (
            <Card sx={{ p: 2 }}>
                <Typography variant="h4">No active balances found.</Typography>
            </Card>
        );
    }

    return (
        <Grid container spacing={3}>
            {balances.map((balance) => (
                <Grid item xs={12} md={6} lg={4} key={balance.currency}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {balance.currency} Balance
                            </Typography>

                            <Box display="flex" alignItems="baseline" sx={{ mb: 2 }}>
                                <Typography variant="h2" sx={{ mr: 1 }}>
                                    {formatCurrencyMinor(balance.available_amount, balance.currency)}
                                </Typography>
                                <Typography variant="subtitle1" color="success.main">
                                    Available
                                </Typography>
                                <Tooltip title="Funds currently available for the next payout cycle.">
                                    <IconButton size="small" sx={{ ml: 0.5 }}>
                                        <HelpOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Pending
                                        <Tooltip title="Funds in escrow or currently processing.">
                                            <IconButton size="small" sx={{ p: 0.5 }}>
                                                <HelpOutlineIcon fontSize="inherit" />
                                            </IconButton>
                                        </Tooltip>
                                    </Typography>
                                    <Typography variant="h5">
                                        {formatCurrencyMinor(balance.pending_amount, balance.currency)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Active Payouts
                                    </Typography>
                                    <Typography variant="h5">
                                        {/* Note: This field is technically 'Net Flow' in service, usually negative. We show paid out magnitude. */}
                                        {formatCurrencyMinor(balance.total_paid_out, balance.currency)}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 2, pt: 2, borderTop: `1px dashed ${theme.palette.divider}` }}>
                                <Typography variant="body2" color="text.secondary">
                                    Lifetime Gross Volume
                                </Typography>
                                <Typography variant="h6">
                                    {formatCurrencyMinor(balance.lifetime_gross_earned, balance.currency)}
                                </Typography>
                            </Box>

                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
    );
};

export default BalanceDisplay;

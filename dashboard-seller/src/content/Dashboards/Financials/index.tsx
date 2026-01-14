import { FC, useState, ChangeEvent, SyntheticEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Container, Grid, Tabs, Tab, Box, Typography, Card } from '@mui/material';
import Footer from 'src/components/Footer';

import BalanceDisplay from './BalanceDisplay';
import OrdersFinancialList from './OrdersFinancialList';
import PayoutsList from './PayoutsList';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`
    };
}

const FinancialsDashboard: FC = () => {
    const [value, setValue] = useState(0);

    const handleTabChange = (event: SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <>
            <Helmet>
                <title>Seller Financials</title>
            </Helmet>
            <PageTitleWrapper>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Typography variant="h3" component="h3" gutterBottom>
                            Financials
                        </Typography>
                        <Typography variant="subtitle2">
                            View your financial status, order earnings, and payout history.
                        </Typography>
                    </Grid>
                </Grid>
            </PageTitleWrapper>
            <Container maxWidth="lg">
                <Grid
                    container
                    direction="row"
                    justifyContent="center"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12}>
                        <BalanceDisplay />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ width: '100%' }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs value={value} onChange={handleTabChange} aria-label="financial tabs">
                                    <Tab label="Order Earnings" {...a11yProps(0)} />
                                    <Tab label="Payout History" {...a11yProps(1)} />
                                </Tabs>
                            </Box>
                            <TabPanel value={value} index={0}>
                                <OrdersFinancialList />
                            </TabPanel>
                            <TabPanel value={value} index={1}>
                                <PayoutsList />
                            </TabPanel>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
            <Footer />
        </>
    );
};

export default FinancialsDashboard;

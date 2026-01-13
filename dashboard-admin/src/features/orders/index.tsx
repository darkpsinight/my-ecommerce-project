import { useEffect, useState, useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { OrdersTable } from './components/orders-table'
import { ordersService } from '@/services/orders-service'
import { Order } from './data/schema'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { OrdersProvider } from './orders-context'

const route = getRouteApi('/_authenticated/orders/')

export function Orders() {
    const search = route.useSearch()
    const [data, setData] = useState<Order[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const fetchOrders = useCallback(async (signal?: AbortSignal) => {
        setIsLoading(true)
        try {
            const res = await ordersService.getOrders({
                page: search.page,
                limit: search.pageSize,
                // Backend currently supports single status, so we pick the first if multiple
                status: search.status?.[0],
                escrowStatus: search.escrowStatus?.[0],
                search: search.search,
                sortBy: search.sort,
                sortOrder: search.order,
                signal
            })
            setData(res.orders)
            setTotal(res.pagination.total)
        } catch (error) {
            // Ignore abort errors
            if (error instanceof Error && error.message === 'canceled') return;
            // Axios abort check
            // @ts-ignore
            if (error.code === 'ERR_CANCELED') return;

            console.error('Failed to fetch orders', error)
        } finally {
            // Only stop loading if not aborted (optional, but good for UX)
            if (!signal?.aborted) {
                setIsLoading(false)
            }
        }
    }, [search])

    useEffect(() => {
        const controller = new AbortController()
        fetchOrders(controller.signal)
        return () => controller.abort()
    }, [fetchOrders])

    return (
        // Simple Provider wrapper if needed, omitting for now
        <OrdersProvider value={{ refresh: () => fetchOrders() }}>
            <div className='flex min-h-screen flex-col'>
                <Header fixed>
                    <Search />
                    <div className='ms-auto flex items-center space-x-4'>
                        <ThemeSwitch />
                        <ConfigDrawer />
                        <ProfileDropdown />
                    </div>
                </Header>
                <Main>
                    <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
                        <div>
                            <h2 className='text-2xl font-bold tracking-tight'>Orders</h2>
                            <p className='text-muted-foreground'>
                                Manage marketplace orders and escrow releases.
                            </p>
                        </div>
                        <div className='flex gap-2'>
                            <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={isLoading}>
                                <ReloadIcon className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                        <OrdersTable data={data} total={total} loading={isLoading} />
                    </div>
                </Main>
            </div>
        </OrdersProvider>
    )
}

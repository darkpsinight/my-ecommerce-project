import { createContext, useContext } from 'react'

interface OrdersContextType {
    refresh: () => void
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({
    children,
    value,
}: {
    children: React.ReactNode
    value: OrdersContextType
}) {
    return (
        <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
    )
}

export function useOrders() {
    const context = useContext(OrdersContext)
    if (context === undefined) {
        throw new Error('useOrders must be used within an OrdersProvider')
    }
    return context
}

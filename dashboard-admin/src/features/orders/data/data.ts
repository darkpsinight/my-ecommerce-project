import {
    CheckCircledIcon,
    CrossCircledIcon,
    StopwatchIcon,
    QuestionMarkCircledIcon,
} from '@radix-ui/react-icons'
import { ShieldAlert, ShieldCheck, Shield } from 'lucide-react'

export const statuses = [
    {
        value: 'pending',
        label: 'Pending',
        icon: StopwatchIcon,
    },
    {
        value: 'completed',
        label: 'Completed',
        icon: CheckCircledIcon,
    },
    {
        value: 'failed',
        label: 'Failed',
        icon: CrossCircledIcon,
    },
    {
        value: 'refunded',
        label: 'Refunded',
        icon: QuestionMarkCircledIcon,
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
        icon: CrossCircledIcon,
    },
]

export const escrowStatuses = [
    {
        value: 'held',
        label: 'Held',
        icon: Shield,
    },
    {
        value: 'released',
        label: 'Released',
        icon: ShieldCheck,
    },
    {
        value: 'refunded',
        label: 'Refunded',
        icon: ShieldAlert,
    },
]

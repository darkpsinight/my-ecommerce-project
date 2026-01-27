import { createFileRoute } from '@tanstack/react-router'
import { DisputeDetail } from '@/features/disputes/components/DisputeDetail'

export const Route = createFileRoute('/_authenticated/disputes/$disputeId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { disputeId } = Route.useParams()
  return <DisputeDetail disputeId={disputeId} />
}

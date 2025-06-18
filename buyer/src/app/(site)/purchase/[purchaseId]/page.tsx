import { PurchaseSuccess } from "@/components/Purchase";

export default function PurchaseSuccessPage({ params }: { params: { purchaseId: string } }) {
  return <PurchaseSuccess purchaseId={params.purchaseId} />;
}
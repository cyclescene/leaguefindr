import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'pending':
      return <Badge variant='pending' className="w-[130px] text-center">Pending Review</Badge>;
    case 'approved':
      return <Badge variant="approve" className="w-[130px] text-center">Approved</Badge>;
    case 'rejected':
      return <Badge variant="reject" className="w-[130px] text-center">Rejected</Badge>;
    case 'draft':
      return <Badge variant="draft" className="w-[130px] text-center">Draft</Badge>;
    default:
      return <Badge className="w-[130px] text-center bg-gray-500 text-white">Unknown</Badge>;
  }
}

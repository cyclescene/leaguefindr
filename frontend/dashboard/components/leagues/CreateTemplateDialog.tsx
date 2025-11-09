import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
}: CreateTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 !max-w-5xl w-[85vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="bg-brand-dark text-white !-mx-6 !-mt-6 !-mb-4 px-6 py-4 rounded-t-lg border-b-2 border-brand-dark">
          <DialogTitle className="text-white">Create Template</DialogTitle>
          <DialogDescription className="text-gray-200">
            Create a template for reusable league configurations. You can use
            this to quickly create similar leagues in the future.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 px-6">
          <p className="text-gray-600">
            Template creation form coming soon...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

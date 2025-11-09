import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { OrganizerTemplateTable } from "@/components/organizer/OrganizerTemplateTable";
import type { Template } from "@/types/leagues";

interface TemplatesTabProps {
  templates: Template[];
  isLoading: boolean;
  onEditTemplate: (templateId: number) => void;
  onUseTemplate: (templateId: number) => void;
  onDeleteTemplate: (templateId: number) => void;
  onCreateTemplate: () => void;
}

export function TemplatesTab({
  templates,
  isLoading,
  onEditTemplate,
  onUseTemplate,
  onDeleteTemplate,
  onCreateTemplate,
}: TemplatesTabProps) {
  return (
    <TabsContent value="templates">
      {isLoading ? (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin text-brand-dark" size={20} />
            <p className="text-neutral-600">Loading templates...</p>
          </div>
        </div>
      ) : templates.length > 0 ? (
        <OrganizerTemplateTable
          templates={templates}
          onEdit={onEditTemplate}
          onUse={onUseTemplate}
          onDelete={onDeleteTemplate}
        />
      ) : (
        <div className="bg-white rounded-lg p-8 border border-neutral-200 text-center">
          <p className="text-neutral-600 mb-4">
            You haven't created any templates yet.
          </p>
          <Button variant="brandDark" onClick={onCreateTemplate}>
            Create Your First Template
          </Button>
        </div>
      )}
    </TabsContent>
  );
}

"use client";

import { useTransition } from "react";
import { Button } from "@appica/ui-react/button";
import { markReportResolved } from "@/lib/report-actions";

export function ResolveReportButton({
  id,
  resolved,
  label,
}: {
  id: number;
  resolved: boolean;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markReportResolved(id, !resolved);
        })
      }
    >
      {label}
    </Button>
  );
}

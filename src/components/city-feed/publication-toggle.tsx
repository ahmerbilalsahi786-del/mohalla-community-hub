import type { MouseEvent } from "react";
import { EyeOff, Globe2, Loader2 } from "lucide-react";
import { canManageCommunity, useCurrentUser } from "@/hooks/use-current-user";
import {
  CityPublicationSourceType,
  useCityPublicationStatus,
  usePublishCityPublication,
  useUnpublishCityPublication,
} from "@/lib/city-publications";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Variant = "icon" | "chip" | "table";

interface PublicationToggleProps {
  sourceType: CityPublicationSourceType;
  sourceId: string | number;
  variant?: Variant;
  className?: string;
  stopNavigation?: boolean;
}

export function PublicationToggle({
  sourceType,
  sourceId,
  variant = "chip",
  className,
  stopNavigation = false,
}: PublicationToggleProps) {
  const { data: user } = useCurrentUser();
  const canPublish = canManageCommunity(user?.role);
  const { toast } = useToast();
  const status = useCityPublicationStatus(sourceType, sourceId, canPublish);
  const publish = usePublishCityPublication();
  const unpublish = useUnpublishCityPublication();

  if (!canPublish) return null;

  const isPublic = status.data?.isPublic ?? false;
  const busy = status.isLoading || publish.isPending || unpublish.isPending;
  const Icon = busy ? Loader2 : isPublic ? EyeOff : Globe2;
  const label = isPublic ? "Unpublish" : "Make public";

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopNavigation) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      if (isPublic) {
        await unpublish.mutateAsync({ sourceType, sourceId });
        toast({ title: "Removed from City Feed." });
      } else {
        await publish.mutateAsync({ sourceType, sourceId });
        toast({ title: "Published to City Feed." });
      }
    } catch (error) {
      toast({
        title: "Could not update City Feed.",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-label={label}
        title={label}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50",
          isPublic && "bg-primary/10 text-primary",
          className,
        )}
      >
        <Icon size={15} className={busy ? "animate-spin" : ""} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
        variant === "table" ? "min-h-7" : "min-h-8",
        isPublic
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "bg-sky-500/10 text-sky-700 hover:bg-sky-500/20",
        className,
      )}
    >
      <Icon size={variant === "table" ? 12 : 13} className={busy ? "animate-spin" : ""} />
      <span>{busy ? "Saving" : isPublic ? "Public" : "Make public"}</span>
    </button>
  );
}

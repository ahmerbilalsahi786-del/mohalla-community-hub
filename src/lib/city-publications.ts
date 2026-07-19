import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@/lib/custom-fetch";

export type CityPublicationSourceType = "post" | "event" | "listing" | "poll" | "safety_alert" | "place" | "volunteer";

export interface CityPublication {
  id: number;
  communityId: string;
  city: string;
  sourceType: CityPublicationSourceType;
  sourceId: string;
  title: string;
  summary: string;
  imageUrl?: string | null;
  imageMeta?: Array<{ url: string; width?: number | null; height?: number | null }>;
  href: string;
  authorId?: string | null;
  authorName: string;
  communityName: string;
  communityArea?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  publishedBy?: string | null;
  publishedAt: string;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface CityMapCommunity {
  id: string;
  name: string;
  area?: string | null;
  city: string;
  logoUrl?: string | null;
  latitude: number;
  longitude: number;
}

export interface CityPublicationList {
  items: CityPublication[];
  communities: CityMapCommunity[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  city: string;
}

export interface CityPublicationStatus {
  isPublic: boolean;
  publication: CityPublication | null;
}

export interface CityPublicationParams {
  sourceType?: CityPublicationSourceType | "all";
  search?: string;
  page?: number;
  limit?: number;
}

export interface PublishCityPublicationInput {
  sourceType: CityPublicationSourceType;
  sourceId: string | number;
}

function queryString(params?: object) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function getListCityPublicationsQueryKey(params?: CityPublicationParams) {
  return ["/api/city-feed", params ?? {}] as const;
}

export function getCityPublicationStatusQueryKey(sourceType?: CityPublicationSourceType, sourceId?: string | number) {
  return ["/api/city-feed/status", sourceType, sourceId ? String(sourceId) : ""] as const;
}

export async function listCityPublications(params?: CityPublicationParams) {
  return customFetch<CityPublicationList>(`/api/city-feed${queryString(params)}`, { method: "GET" });
}

export async function getCityPublicationStatus(sourceType: CityPublicationSourceType, sourceId: string | number) {
  return customFetch<CityPublicationStatus>(
    `/api/city-feed/status${queryString({ sourceType, sourceId: String(sourceId) })}`,
    { method: "GET" },
  );
}

export async function publishCityPublication(input: PublishCityPublicationInput) {
  return customFetch<CityPublication>("/api/city-feed/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, sourceId: String(input.sourceId) }),
  });
}

export async function unpublishCityPublication(input: PublishCityPublicationInput) {
  return customFetch<{ ok: boolean }>("/api/city-feed/publish", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, sourceId: String(input.sourceId) }),
  });
}

export function useListCityPublications(params?: CityPublicationParams) {
  return useQuery({
    queryKey: getListCityPublicationsQueryKey(params),
    queryFn: () => listCityPublications(params),
  });
}

export function useCityPublicationStatus(
  sourceType: CityPublicationSourceType,
  sourceId: string | number,
  enabled = true,
) {
  return useQuery({
    queryKey: getCityPublicationStatusQueryKey(sourceType, sourceId),
    queryFn: () => getCityPublicationStatus(sourceType, sourceId),
    enabled: enabled && Boolean(sourceType) && Boolean(sourceId),
  });
}

export function usePublishCityPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishCityPublication,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-feed"] });
      queryClient.invalidateQueries({ queryKey: getCityPublicationStatusQueryKey(variables.sourceType, variables.sourceId) });
    },
  });
}

export function useUnpublishCityPublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unpublishCityPublication,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/city-feed"] });
      queryClient.invalidateQueries({ queryKey: getCityPublicationStatusQueryKey(variables.sourceType, variables.sourceId) });
    },
  });
}

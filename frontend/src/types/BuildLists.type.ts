export interface BuildSummary {
  id: number;
  name: string;
  description?: string;
  published: boolean;
  photoUrl?: string;
  createdAt: string;
  user?: { username: string };
}

export interface BuildCardProps {
  build: BuildSummary;
  onClick: () => void;
  footerInfo?: React.ReactNode;
}

export interface UseBuildsParams {
  url: string;
  page: number;
  pageSize: number;
  order: string;
  search: string;
  authToken?: string;
}
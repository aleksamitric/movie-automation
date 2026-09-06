export interface DebatePostCreateRequest {
  title: string | null;
  content: string;
  parentId: number | null;
  filmId: number | null;
  seriesId: number | null;
  tags: string[];
  isSpoiler: boolean;
}

export interface DebatePost {
  id: number;
  title: string | null;
  content: string;
  createdAt: string;
  parentId: number | null;
  userId: number;
  username: string;
  filmId: number | null;
  filmTitle: string | null;
  filmPosterUrl: string | null;
  seriesId: number | null;
  seriesTitle: string | null;
  seriesPosterUrl: string | null;
  tags: string[];
  isSpoiler: boolean;
  viewCount: number;
  likesCount: number;
  replyCount: number;
  isLikedByUser: boolean;
  replies: DebatePost[];
}

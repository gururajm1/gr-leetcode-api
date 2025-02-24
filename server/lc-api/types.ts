export interface Discussion {
    id: string;
    title: string;
    tags: string[];
  }
  
  export interface DiscussionDetails {
    id: string;
    title: string;
    content: string;
  }
  
  interface CategoryTopicListResponse {
    data?: {
      categoryTopicList?: {
        edges: {
          node: {
            id: string;
            title: string;
            tags: { name: string }[];
          };
        }[];
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
      } | null;
    } | null;
  }
  
  export interface DiscussTopicResponse {
    topic: {
      id: string;
      title: string;
      post?: {
        content: string;
      };
    };
  }
  
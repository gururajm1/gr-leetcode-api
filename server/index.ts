import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import readline from "readline";
import { CATEGORY_TOPIC_LIST, DISCUSS_TOPIC } from "./query"; // Ensure this is correctly defined

const URL: string = process.env.URL || "";
const CATEGORIES: string = "interview-question";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
}

interface Discussion {
  id: string;
  title: string;
  tags: string[];
}

interface DiscussionDetails {
  id: string;
  title: string;
  content: string;
}

interface CategoryTopicListResponse {
  data: {
    categoryTopicList: {
      edges: { node: { id: string; title: string; tags: { name: string }[] } }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
}

interface DiscussTopicResponse {
  data: {
    topic: {
      id: string;
      title: string;
      post?: { content: string };
    };
  };
}

async function fetchAllDiscussions(): Promise<void> {
  const QUERY_STRING: string = await askQuestion("Enter position: ");
  const TAGS_INPUT: string = await askQuestion("Enter company name: ");
  rl.close();

  const TAGS: string[] = TAGS_INPUT ? TAGS_INPUT.split(",").map((tag: string) => tag.trim()) : [];
  let afterCursor: string | null = null;
  let hasNextPage: boolean = true;

  while (hasNextPage) {
    try {
      const response = await axios.post<CategoryTopicListResponse>(URL, {
        operationName: "categoryTopicList",
        query: CATEGORY_TOPIC_LIST,
        variables: {
          orderBy: "most_relevant",
          query: QUERY_STRING,
          tags: TAGS,
          categories: CATEGORIES,
          after: afterCursor,
        },
      });

      const data: CategoryTopicListResponse["data"] = response.data.data;
      if (!data || !data.categoryTopicList) {
        console.error("❌ No data received!");
        break;
      }

      const discussions: Discussion[] = data.categoryTopicList.edges.map(
        (edge: { node: { id: string; title: string; tags: { name: string }[] } }) => ({
          id: edge.node.id,
          title: edge.node.title,
          tags: edge.node.tags.map((tag: { name: string }) => tag.name),
        })
      );

      hasNextPage = data.categoryTopicList.pageInfo.hasNextPage;
      afterCursor = data.categoryTopicList.pageInfo.endCursor;

      console.log(`✅ Fetched ${discussions.length} discussions, fetching details...`);

      const discussionDetails: (DiscussionDetails | null)[] = await Promise.all(
        discussions.map((d: Discussion) => fetchDiscussionById(d.id))
      );
      const filteredDiscussions = discussionDetails.filter((d): d is DiscussionDetails => d !== null);

      console.log("\n✅ Matched Discussions:\n");
      filteredDiscussions.forEach((discussion: DiscussionDetails) => {
        console.log(`Title: ${discussion.title}\n`);
        console.log(`${discussion.content}\n`);
        console.log("-------------------------------------------------\n");
      });

      await delay(Math.floor(Math.random() * (5000 - 3000 + 1) + 3000));
    } catch (error: any) {
      console.error("❌ Error fetching discussions:", error.response?.data || error.message);
      break;
    }
  }
}

async function fetchDiscussionById(topicId: string): Promise<DiscussionDetails | null> {
  try {
    const response = await axios.post<DiscussTopicResponse>(URL, {
      operationName: "DiscussTopic",
      query: DISCUSS_TOPIC,
      variables: { topicId },
    });

    const discussion: DiscussTopicResponse["data"]["topic"] = response.data.data?.topic;
    if (!discussion) {
      console.error(`❌ No discussion data found for ID: ${topicId}`);
      return null;
    }

    return {
      id: discussion.id,
      title: discussion.title,
      content: discussion.post?.content.replace(/\\n/g, "\n") || "No content available",
    };
  } catch (error: any) {
    console.error(`❌ Error fetching discussion ID ${topicId}:`, error.response?.data || error.message);
    return null;
  }
}

fetchAllDiscussions();

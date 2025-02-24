require("dotenv").config();
const axios = require("axios");
const readline = require("readline");
const QUERY = require("./query");

const LEETCODE_GRAPHQL_URL = process.env.LEETCODE_GRAPHQL_URL || "https://leetcode.com/graphql";
const CATEGORIES = process.env.CATEGORIES ? process.env.CATEGORIES.split(",") : ["interview-question"];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, (answer) => resolve(answer));
  });
}

async function fetchAllDiscussions() {
  let QUERY_STRING = await askQuestion("Enter position: ");
  let TAGS_INPUT = await askQuestion("Enter company name: ");
  rl.close();

  const TAGS = TAGS_INPUT ? TAGS_INPUT.split(",").map((tag) => tag.trim()) : [];
  let afterCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await axios.post(LEETCODE_GRAPHQL_URL, {
        operationName: "categoryTopicList",
        query: QUERY.CATEGORY_TOPIC_LIST,
        variables: {
          orderBy: "most_relevant",
          query: QUERY_STRING,
          tags: TAGS,
          categories: CATEGORIES,
          after: afterCursor,
        },
      });

      const data = response.data.data?.categoryTopicList;
      if (!data) {
        console.error("❌ No data received!");
        break;
      }

      const discussions = data.edges.map((edge) => ({
        id: edge.node.id,
        title: edge.node.title,
        tags: edge.node.tags.map((tag) => tag.name),
      }));

      hasNextPage = data.pageInfo.hasNextPage;
      afterCursor = data.pageInfo.endCursor;

      console.log(`✅ Fetched ${discussions.length} discussions, fetching details...`);

      const discussionDetails = await Promise.all(discussions.map((d) => fetchDiscussionById(d.id)));
      const filteredDiscussions = discussionDetails.filter((d) => d !== null);

      console.log("\n✅ Matched Discussions:\n");
      filteredDiscussions.forEach((discussion) => {
        console.log(`Title: ${discussion.title}\n`);
        console.log(`${discussion.content}\n`);
        console.log("-------------------------------------------------\n");
      });

      await delay(Math.floor(Math.random() * (5000 - 3000 + 1) + 3000));
    } catch (error) {
      console.error("❌ Error fetching discussions:", error.response?.data || error.message);
      break;
    }
  }
}

async function fetchDiscussionById(topicId) {
  try {
    const response = await axios.post(LEETCODE_GRAPHQL_URL, {
      operationName: "DiscussTopic",
      query: QUERY.DISCUSS_TOPIC,
      variables: { topicId },
    });

    const discussion = response.data.data?.topic;
    if (!discussion) {
      console.error(`❌ No discussion data found for ID: ${topicId}`);
      return null;
    }

    return {
      id: discussion.id,
      title: discussion.title,
      content: discussion.post?.content.replace(/\\n/g, '\n') || "No content available",
    };
  } catch (error) {
    console.error(`❌ Error fetching discussion ID ${topicId}:`, error.response?.data || error.message);
    return null;
  }
}

fetchAllDiscussions();

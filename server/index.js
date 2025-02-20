require("dotenv").config();
const axios = require("axios");
const QUERY = require("./query");

const LEETCODE_GRAPHQL_URL = process.env.LEETCODE_GRAPHQL_URL || "https://leetcode.com/graphql";
const QUERY_STRING = process.env.QUERY_STRING || "SDE";
const TAGS = process.env.TAGS ? process.env.TAGS.split(",") : ["google"];
const CATEGORIES = process.env.CATEGORIES ? process.env.CATEGORIES.split(",") : ["interview-question"];

async function fetchAllDiscussions() {
  let allDiscussions = [];
  let afterCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await axios.post(LEETCODE_GRAPHQL_URL, {
        operationName: "categoryTopicList",
        query: QUERY,
        variables: {
          orderBy: "most_relevant",
          query: QUERY_STRING,
          tags: TAGS,
          categories: CATEGORIES,
          after: afterCursor,
        },
      });

      const data = response.data.data.categoryTopicList;
      if (!data) {
        console.error("❌ No data received!");
        break;
      }

      const discussions = data.edges.map((edge) => ({
        id: edge.node.id,
        title: edge.node.title,
        tags: edge.node.tags.map(tag => tag.name),
      }));

      allDiscussions.push(...discussions);

      hasNextPage = data.pageInfo.hasNextPage;
      afterCursor = data.pageInfo.endCursor;

    } catch (error) {
      console.error("❌ Error fetching data:", error.response ? error.response.data : error.message);
      break;
    }
  }

  console.log(JSON.stringify(allDiscussions, null, 2));
}

fetchAllDiscussions();
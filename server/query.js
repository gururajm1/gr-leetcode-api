module.exports = `
query categoryTopicList($categories: [String!]!, $orderBy: TopicSortingOption, $query: String, $tags: [String!], $after: String) {
  categoryTopicList(categories: $categories, orderBy: $orderBy, query: $query, tags: $tags, first: 20, after: $after) {
    edges {
      node {
        id
        title
        tags {
          name
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

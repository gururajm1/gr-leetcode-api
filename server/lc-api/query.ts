const CATEGORY_TOPIC_LIST: string = `
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

const DISCUSS_TOPIC: string = `
  query DiscussTopic($topicId: Int!) {
    topic(id: $topicId) {
      id
      viewCount
      topLevelCommentCount
      subscribed
      title
      pinned
      tags
      hideFromTrending
      post {
        id
        voteCount
        voteStatus
        content
        updationDate
        creationDate
        status
        isHidden
        coinRewards {
          id
          score
          description
          date
        }
        author {
          isDiscussAdmin
          isDiscussStaff
          username
          nameColor
          activeBadge {
            displayName
            icon
          }
          profile {
            userAvatar
            reputation
            realName
          }
          isActive
        }
        authorIsModerator
        isOwnPost
      }
    }
  }`;

export { CATEGORY_TOPIC_LIST, DISCUSS_TOPIC };
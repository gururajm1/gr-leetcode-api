"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISCUSS_TOPIC = exports.CATEGORY_TOPIC_LIST = void 0;
const CATEGORY_TOPIC_LIST = `
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
exports.CATEGORY_TOPIC_LIST = CATEGORY_TOPIC_LIST;
const DISCUSS_TOPIC = `
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
exports.DISCUSS_TOPIC = DISCUSS_TOPIC;

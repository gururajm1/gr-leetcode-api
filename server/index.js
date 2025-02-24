"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const readline_1 = __importDefault(require("readline"));
const query_1 = require("./query"); // Ensure this is correctly defined
const URL = process.env.URL || "";
const CATEGORIES = "interview-question";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function askQuestion(query) {
    return new Promise((resolve) => {
        rl.question(query, (answer) => resolve(answer));
    });
}
function fetchAllDiscussions() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const QUERY_STRING = yield askQuestion("Enter position: ");
        const TAGS_INPUT = yield askQuestion("Enter company name: ");
        rl.close();
        const TAGS = TAGS_INPUT ? TAGS_INPUT.split(",").map((tag) => tag.trim()) : [];
        let afterCursor = null;
        let hasNextPage = true;
        while (hasNextPage) {
            try {
                const response = yield axios_1.default.post(URL, {
                    operationName: "categoryTopicList",
                    query: query_1.CATEGORY_TOPIC_LIST,
                    variables: {
                        orderBy: "most_relevant",
                        query: QUERY_STRING,
                        tags: TAGS,
                        categories: CATEGORIES,
                        after: afterCursor,
                    },
                });
                const data = response.data.data;
                if (!data || !data.categoryTopicList) {
                    console.error("❌ No data received!");
                    break;
                }
                const discussions = data.categoryTopicList.edges.map((edge) => ({
                    id: edge.node.id,
                    title: edge.node.title,
                    tags: edge.node.tags.map((tag) => tag.name),
                }));
                hasNextPage = data.categoryTopicList.pageInfo.hasNextPage;
                afterCursor = data.categoryTopicList.pageInfo.endCursor;
                console.log(`✅ Fetched ${discussions.length} discussions, fetching details...`);
                const discussionDetails = yield Promise.all(discussions.map((d) => fetchDiscussionById(d.id)));
                const filteredDiscussions = discussionDetails.filter((d) => d !== null);
                console.log("\n✅ Matched Discussions:\n");
                filteredDiscussions.forEach((discussion) => {
                    console.log(`Title: ${discussion.title}\n`);
                    console.log(`${discussion.content}\n`);
                    console.log("-------------------------------------------------\n");
                });
                yield delay(Math.floor(Math.random() * (5000 - 3000 + 1) + 3000));
            }
            catch (error) {
                console.error("❌ Error fetching discussions:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                break;
            }
        }
    });
}
function fetchDiscussionById(topicId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const response = yield axios_1.default.post(URL, {
                operationName: "DiscussTopic",
                query: query_1.DISCUSS_TOPIC,
                variables: { topicId },
            });
            const discussion = (_a = response.data.data) === null || _a === void 0 ? void 0 : _a.topic;
            if (!discussion) {
                console.error(`❌ No discussion data found for ID: ${topicId}`);
                return null;
            }
            return {
                id: discussion.id,
                title: discussion.title,
                content: ((_b = discussion.post) === null || _b === void 0 ? void 0 : _b.content.replace(/\\n/g, "\n")) || "No content available",
            };
        }
        catch (error) {
            console.error(`❌ Error fetching discussion ID ${topicId}:`, ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
            return null;
        }
    });
}
fetchAllDiscussions();

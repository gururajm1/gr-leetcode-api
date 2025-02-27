import axios from 'axios';
import * as readline from 'readline';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

// Configure cookie jar and axios instance
const jar = new CookieJar();
const client = wrapper(
  axios.create({
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Origin': 'https://www.glassdoor.co.in',
      'Referer': 'https://www.glassdoor.co.in/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Priority': 'u=1, i'
    }
  })
);
(client.defaults as any).jar = jar;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const securePrompt = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

const getCSRFToken = async (): Promise<string> => {
  await client.get('https://www.glassdoor.co.in/profile/login_input.htm');
  const cookies = await jar.getCookies('https://www.glassdoor.co.in');
  const csrfCookie = cookies.find(c => c.key === 'gd-csrf-token');
  
  if (!csrfCookie) throw new Error('CSRF token not found');
  return csrfCookie.value;
};

const login = async (username: string, password: string): Promise<void> => {
  const csrfToken = await getCSRFToken();
  
  await client.post('https://www.glassdoor.co.in/profile/ajax/login.htm', {
    username,
    password,
    _csrf: csrfToken
  }, {
    headers: {
      'Content-Type': 'application/json',
      'gd-csrf-token': csrfToken
    }
  });
};

const fetchInterviewData = async (employerId: string, jobTitle: string) => {
  const csrfToken = await getCSRFToken();
  
  const payload = [
    {
      operationName: "RecordPageView",
      variables: { employerId, pageIdent: "INFOSITE_INTERVIEWS" },
      query: "mutation RecordPageView($employerId: String!, $pageIdent: String!) {\n  recordPageView(\n    pageIdent: $pageIdent\n    metaData: {key: \"employerId\", value: $employerId}\n  ) {\n    totalCount\n    __typename\n  }\n}\n"
    },
    {
      operationName: "InterviewsPageGraphQuery",
      variables: {
        employerId: parseInt(employerId),
        sort: "RELEVANCE",
        jobTitle: { text: jobTitle },
        goc: null,
        location: { countryId: null, stateId: null, metroId: null, cityId: null },
        outcome: [],
        page: 1,
        itemsPerPage: 10,
        tldId: 4
      },
      query: `query InterviewsPageGraphQuery($sort: InterviewsSortOrderEnum, $employerId: Int!, $goc: Int, $jobTitle: JobTitleIdent, $location: LocationIdent, $outcome: [InterviewOutcomeEnum], $page: Int!, $itemsPerPage: Int!, $tldId: Int!) {
        employerInterviews: employerInterviewsIG(
          employerInterviewsInput: {sort: $sort, employer: {id: $employerId}, jobTitle: $jobTitle, goc: {sgocId: $goc}, location: $location, outcomes: $outcome, page: {num: $page, size: $itemsPerPage}}
        ) {
          currentPageNum
          totalNumberOfPages
          totalInterviewCount
          filteredInterviewCount
          interviewExperienceCounts {
            type
            count
            __typename
          }
          content: interviews {
            id
            advice
            difficulty
            interviewDateTime
            jobTitle {
              text
              __typename
            }
            __typename
          }
          __typename
        }
      }`
    }
  ];

  const response = await client.post('https://www.glassdoor.co.in/graph', payload, {
    headers: {
      'Content-Type': 'application/json',
      'gd-csrf-token': csrfToken,
      'apollographql-client-name': 'ei-interviews-next',
      'apollographql-client-version': '1.53.9'
    }
  });

  return response.data;
};

(async () => {
  try {
    const username = await securePrompt('Enter Glassdoor username: ');
    const password = await securePrompt('Enter Glassdoor password: ');
    const employerId = await securePrompt('Enter Employer ID: ');
    const jobTitle = await securePrompt('Enter Job Title: ');

    await login(username, password);
    const data = await fetchInterviewData(employerId, jobTitle);
    
    console.log('\nSuccessfully fetched data:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    if ((error)) {
      console.error('\nError:', error || error);
    } else if (error instanceof Error) {
      console.error('\nError:', error.message);
    } else {
      console.error('\nUnknown error occurred');
    }
  } finally {
    rl.close();
    process.exit();
  }
})();
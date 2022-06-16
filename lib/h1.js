const fs = require('fs').promises;
const axios = require('axios');

const refreshIntervalHours = process.env.REFRESH_INTERVAL_HOURS || 12;

let reports = [];
let refreshInProgress = false;

let axiosInstance = axios.create({
    baseURL: 'https://hackerone.com',
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
        'Content-Type': 'application/json',
        'Origin': 'https://hackerone.com'
    }
});

function getReports() {
    return reports;
}

async function loadReports() {
    try {
        reports = JSON.parse(await fs.readFile('reports.json', 'utf8')).sort((a, b) => { return a.id - b.id });;
    } catch (err) {
        await fetchAllPublicReports();
    }

    console.info('Reports loaded');
}

async function fetchAllPublicReports() {
    if (refreshInProgress) {
        console.warn('Called fetchAllPublicReports() while refresh in progress!');
        return;
    }

    let query = await fs.readFile('./lib/HacktivityPageQuery.gql', 'utf8');
    let requestBody = {
        operationName: "HacktivityPageQuery",
        variables: {
            "cursor": "",
            "querystring": "",
            "where": {
                "report": {
                    "disclosed_at": {
                        "_is_null": false
                    }
                }
            },
            "orderBy": null,
            "secureOrderBy": null,
            "count": 100
        },
        query
    }

    let retryCount = 0;
    let fetchedReports = [];

    refreshInProgress = true;

    while (retryCount < 10) {
        try {
            console.info('request report chunk');

            let response = await axiosInstance.post('/graphql', requestBody);
            let pageData = response.data.data;
            let pageInfo = pageData.hacktivity_items.pageInfo;
            let pageEdges = pageData.hacktivity_items.edges;

            if (typeof pageInfo !== 'object') {
                throw new Error('Missing pageInfo attribute');
            }

            pageEdges.forEach(edge => {
                let node = edge.node;

                if (!node.report) {
                    console.warn('skip node without report', node);
                    return;
                }

                fetchedReports.push({
                    id: parseInt(node.report.databaseId),
                    state: node.report.substate,
                    title: node.report.title,
                    fetchedAt: new Date(),
                    createdAt: node.report.created_at,
                    disclosedAt: node.report.disclosed_at,
                    lastActivityAt: node.latest_disclosable_activity_at,
                    awardAmount: node.total_awarded_amount,
                    currency: node.currency,
                    reporter: node.reporter,
                    team: node.team
                })
            });

            requestBody.variables.cursor = pageInfo.endCursor;

            if (pageInfo.hasNextPage !== true) {
                console.info('all public reports successfully fetched');
                reports = fetchedReports.sort((a, b) => { return a.id - b.id });
                break;
            }

            console.info(`${fetchedReports.length} / ${pageData.hacktivity_items.total_count} reports retrieved`);

            retryCount = 0;
        } catch (err) {
            console.error(err.message);
            console.error('Retry', retryCount);
            retryCount += 1;
        }
    }

    refreshInProgress = false;

    try {
        await fs.writeFile('reports.json', JSON.stringify(reports));
        await fs.writeFile(`reports_${new Date().toISOString().substring(0, 7)}.json`, JSON.stringify(reports));
        console.info('reports.json saved!')
    } catch (err) {
        console.error('Failed to write reports.txt', err);
    }
}

loadReports();

// Refresh Reports every x hours
setInterval(fetchAllPublicReports, 1000 * 60 * 60 * refreshIntervalHours);
console.log('Refresh Timer Interval (hours):', refreshIntervalHours);

module.exports = {
    getReports
}
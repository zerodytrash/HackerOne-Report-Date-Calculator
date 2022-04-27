const h1 = require('../lib/h1');
const utils = require('../lib/utils');

async function getReports(req, res) {
    res.status(200).send(h1.getReports());
}

async function getReportById(req, res) {
    if (isNaN(req.params.reportId) || req.params.reportId < 1) {
        res.status(400).send({ errorMessage: 'Invalid reportId' });
        return;
    }

    try {
        const reportId = parseInt(req.params.reportId);
        const allReports = h1.getReports();
        const disclosedReport = allReports.find(x => x.id === reportId) || null;

        const result = {
            reportId: reportId,
            report: disclosedReport,
            disclosed: disclosedReport !== null
        }

        result.surroundingReports = {
            before: allReports.filter(x => x.id < reportId).slice(-4),
            after: allReports.filter(x => x.id > reportId).slice(0, 4),
        }

        const closestReportBefore = result.surroundingReports.before.at(-1);
        const closestReportAfter = result.surroundingReports.after[0];

        result.calculation = {
            success: !!closestReportBefore && !!closestReportAfter,
            createdBefore: closestReportAfter?.createdAt,
            createdAfter: closestReportBefore?.createdAt,
            reportCountToClosestBefore: closestReportBefore ? reportId - closestReportBefore?.id : 0,
            reportCountToClosestAfter: closestReportAfter ? closestReportAfter?.id - reportId : 0,
            estimatedCreatedAt: closestReportBefore && closestReportAfter ? utils.calcReportCreatedAt(reportId, closestReportBefore, closestReportAfter) : null
        }

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ errorMessage: err.message });
    }
}

module.exports = {
    getReports,
    getReportById
}
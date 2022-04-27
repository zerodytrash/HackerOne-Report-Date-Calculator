function calcReportCreatedAt(reportId, reportBefore, reportAfter) {
    const reportBeforeDate = new Date(reportBefore.createdAt);
    const reportAfterDate = new Date(reportAfter.createdAt);

    const millisBetween = reportAfterDate.getTime() - reportBeforeDate.getTime();

    const beforeToAfterSpan = reportAfter.id - reportBefore.id;
    const beforeToThisSpan = reportId - reportBefore.id;
    const positionRatio = beforeToThisSpan / beforeToAfterSpan;

    return new Date(reportBeforeDate.getTime() + Math.round((millisBetween * positionRatio)));
}

module.exports = {
    calcReportCreatedAt
}
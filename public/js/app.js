let urlReportId = parseInt(getSearchParam('reportId'));
let currentReportId = 0;
let windowMainTitle = document.title;

const $result = $('#result');
const $inputReportId = $('#inputReportId');
const $errorMessage = $('#errorMessage');
const $apiUrl = $('#apiUrl');

$result.css('display', 'block');
$result.hide();

setApiUrl();

$inputReportId.change(onInputValueChange);
$inputReportId.keyup(onInputValueChange);
$inputReportId.focus();

if (urlReportId) {
    $inputReportId.val(urlReportId);
    $inputReportId.change();
}

function onInputValueChange() {
    let reportId = parseInt($(this).val());

    setReportId(reportId || 0);
}

function setReportId(reportId) {
    if (currentReportId !== reportId) {
        currentReportId = reportId;

        if (reportId > 0) {
            loadReport(reportId);
        }

        if (reportId === 0) {
            $result.slideUp(200);
        }

        document.title = reportId > 0 ? `#${reportId} - ${windowMainTitle}` : windowMainTitle;
        addSearchParam('reportId', reportId);
        setApiUrl();
    }
}

async function loadReport(reportId) {
    try {
        let result = await $.get(`/api/reports/${reportId}`);

        // Prevent overlapping responses
        if (result.reportId === currentReportId) {
            setResult(result);
        }
        
    } catch (err) {
        $errorMessage.text(err.responseJSON?.errorMessage || 'A network error has occurred');
    }
}

function setResult(result) {

    $errorMessage.text('');

    let $report = $('.report').first();

    $report.find('.reportId').text('Report #' + result.reportId);
    $report.find('.timeframe').text(formatDate(result.calculation.createdAfter) + ' - ' + formatDate(result.calculation.createdBefore) + ' (' + formatTimeSpan(result.calculation.createdAfter, result.calculation.createdBefore) + ')');
    $report.find('.timeframe').attr('title', formatDateTime(result.calculation.createdAfter) + ' - ' + formatDateTime(result.calculation.createdBefore));
    $report.find('.estimatedDate').text(formatDateTime(result.calculation.estimatedCreatedAt));
    $report.find('.estimatedAge').text(formatTimeSpan(result.calculation.estimatedCreatedAt, new Date()) + ' ago');

    setSurroundingReport($('.surroundingReports.before').first(), result.surroundingReports.before, true);
    setSurroundingReport($('.surroundingReports.after').first(), result.surroundingReports.after, false);

    $result.slideDown(200);
}

function setSurroundingReport(container, items, isBefore) {
    container.empty();

    if (items.length === 0) {
        container.html('<i>No reports found at this end :(</i>');
        return;
    }

    let fontSizeEm = 1;
    let fontSiteEmDiff = 0.4;
    let fontSizeEmStep = fontSiteEmDiff / items.length;

    let opacity = 1;
    let opacityDiff = 0.5;
    let opacityStep = opacityDiff / items.length;

    if (isBefore) {
        fontSizeEm -= fontSiteEmDiff - fontSizeEmStep;
        opacity -= opacityDiff - opacityStep;
    }

    items.forEach(report => {
        let $div = $('<div>').css('font-size', fontSizeEm + 'em').css('opacity', opacity).attr('title', report.title);
        let $a = $('<a>').text('#' + report.id).attr('href', 'https://hackerone.com/reports/' + report.id).attr('target', '_blank');
        let $span = $('<span>').text(' - ' + formatDateTime(report.createdAt));

        $div.append($a).append($span);
        container.append($div);

        if (isBefore) {
            fontSizeEm += fontSizeEmStep;
            opacity += opacityStep;
        } else {
            fontSizeEm -= fontSizeEmStep;
            opacity -= opacityStep
        }
    });
}

function setApiUrl() {
    $apiUrl.text(location.origin + '/api/reports/' + (currentReportId || '{reportId}'));
}
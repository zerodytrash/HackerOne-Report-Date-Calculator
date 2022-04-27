function addSearchParam(paramName, paramValue) {
    let searchParams = new URLSearchParams(location.search);
    searchParams.set(paramName, paramValue);
    history.replaceState(null, null, location.href.split('?')[0] + '?' + searchParams.toString());
}

function getSearchParam(paramName) {
    let searchParams = new URLSearchParams(location.search);
    return searchParams.get(paramName);
}

function formatDate(isoString) {
    if (!isoString) return '?'
    return new Date(isoString).toLocaleDateString();
}

function formatDateTime(isoString) {
    if (!isoString) return '?'
    return new Date(isoString).toLocaleString();
}

function formatTimeSpan(from, to) {
    if (!from || !to) return '?';

    if (typeof from === 'string') from = new Date(from);
    if (typeof to === 'string') to = new Date(to);

    let diffSecs = (to.getTime() - from.getTime()) / 1000;
    let diffHours = diffSecs / 60 / 60;
    let diffDays = diffHours / 24;

    if (diffDays < 2) {
        return Math.floor(diffHours) + 'h';
    } else {
        return Math.floor(diffDays) + 'd';
    }
}
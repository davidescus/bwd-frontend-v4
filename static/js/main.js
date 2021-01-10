$(document).ready(function () {
    init();
});

// let host = 'http://localhost:8590';
let host = 'http://51.15.242.149:8590';

function init() {
    // apps
    let apps = fetchApps();
    if (apps.length < 1) {
        alert("No available apps!");
        return;
    }

    let appsElem = $('.apps');
    generateAppsSection(apps, appsElem);

    // balance
    // TODO app specific balance
    // TODO general balance

    // trades
    let tradesElem = initTradesTables();
    populateTradesSection(apps[0].id, tradesElem);

    // actions
    let appButtons = appsElem.find('button');
    appButtons.on('click', function () {
        let appId = $(this).attr('data-id');
        populateTradesSection(appId, tradesElem);

        // TODO removeClass not works, should be active only clicked button
        $.each(appButtons, function(e) {
            $(e).removeClass('btn-danger');
        });
        $(this).addClass('btn-danger')
    });
}

// generateAppsSection will generate buttons for each app
function generateAppsSection(apps, appsElem) {
    apps.forEach(function (app, i) {
        let content = `
            <button class="btn btn-info btn-small" data-id="${app.id}">App: ${app.id} (${app.pair})</button>
        `;
        appsElem.append(content);
    });
}

function initTradesTables() {
    let container = $('.trades');

    return {
        active: container.find(".active table").DataTable({
            searching: false,
        }),
        closed: container.find(".closed table").DataTable({
            searching: false,
        }),
    }
}

function populateTradesSection(appId, tradesElem) {
    // fetch trades
    let trades = fetchTrades(appId)

    // active trades
    tradesElem.active.clear().draw();
    for (let i = 0; i < trades.active.length; i++) {
        tradesElem.active.row.add([
            i + 1,
            trades.active[i].open_price,
            trades.active[i].close_price,
            trades.active[i].open_type + ' / ' + trades.active[i].close_type,
            trades.active[i].quote_vol,
            trades.active[i].created_at,
            trades.active[i].converted_sell_limit_at,
        ]).draw(false);
    }

    // closed trades
    tradesElem.closed.clear().draw();
    for (let i = 0; i < trades.closed.length; i++) {
        tradesElem.closed.row.add([
            i + 1,
            trades.closed[i].open_price,
            trades.closed[i].close_price,
            trades.closed[i].open_type + ' / ' + trades.closed[i].close_type,
            trades.closed[i].quote_vol,
            trades.closed[i].created_at,
            trades.closed[i].converted_sell_limit_at,
        ]).draw(false);
    }
}

// ajax call - get all apps
function fetchApps() {
    let resp = [];

    $.ajax({
        url: host + '/pairs',
        type: 'GET',
        async: false,
        dataType: 'json',
        success: function (data, status, xhr) {
            resp = data;
        },
        error: function (jqXhr, textStatus, errorMessage) {
            // TODO show error here
            alert(errorMessage)
        }
    });

    return resp;
}

// ajax call - get trades for specific app
function fetchTrades(appId) {
    let resp = [];

    $.ajax({
        url: host + '/' + appId + '/trades',
        type: 'GET',
        async: false,
        dataType: 'json',
        success: function (data, status, xhr) {
            resp = data;
        },
        error: function (jqXhr, textStatus, errorMessage) {
            // TODO show error here
            alert(errorMessage)
        }
    });

    return resp;
}

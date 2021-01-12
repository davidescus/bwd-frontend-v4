$(document).ready(function () {
    init();
});

// let host = 'http://localhost:8590';
let host = 'http://51.15.242.149:8590';

let activeApp = 0;

function init() {
    // apps
    let apps = fetchApps();
    if (apps.length < 1) {
        alert("No available apps!");
        return;
    }
    activeApp = apps[0].id;

    let appsElem = $('.apps');
    generateAppsSection(apps, appsElem);

    // balance
    // TODO app specific balance
    // TODO general balance
    let latestBalancesElem = $('.latest-balances span');
    populateLatestBalances(latestBalancesElem);
    setInterval(function() {
        populateLatestBalances(latestBalancesElem);
    }, 4000);

    // trades
    let tradesElem = initTradesTables();

    // latest closed trades
    populateLatestTradesClosed(tradesElem);
    setInterval(function() {
        populateLatestTradesClosed(tradesElem);
    }, 2000);

    // closed, active trades
    populateTradesSection(activeApp, tradesElem);
    setInterval(function() {
        populateTradesSection(activeApp, tradesElem);
    }, 4000);

    // actions
    let appButtons = appsElem.find('button');
    appButtons.on('click', function () {
        activeApp = $(this).attr('data-id');
        populateTradesSection(activeApp, tradesElem);

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
        latestClosed: $(".latest-trades-closed table").DataTable({
            searching: false,
            lengthMenu: [5],
            ordering: false,
            info: false,
            bPaginate: false
        }),
    }
}

function populateLatestBalances(latestBalancesElem) {
    let latestBalances = fetchLatestBalances()
    let total = 0;
    let reinvested = 0;
    let content = '';
    latestBalances.forEach(function (e, i) {
       content += `
          <p>
          <strong>${e.app_id}</strong>
          Total: <strong>${(e.total * 30000).toFixed(2)}</strong>
          Reinvested: <strong>${(e.reinvested * 30000).toFixed(2)}</strong>
          Available: <strong>${((e.total - e.reinvested) * 30000).toFixed(2)}</strong> 
          </p>
       `;

       total = total + parseFloat(e.total);
       reinvested = reinvested + parseFloat(e.reinvested);
    });

    content += `
          <hr>
          <p>
          <strong> - </strong>
          Total: <strong>${(total * 30000).toFixed(2)}</strong>
          Reinvested: <strong>${(reinvested * 30000).toFixed(2)}</strong>
          Available: <strong>${((total - reinvested) * 30000).toFixed(2)}</strong> 
          </p>
       `;

    latestBalancesElem.html(content);
}

function populateLatestTradesClosed(tradesElem) {
    // fetch trades
    let trades = fetchLatestClosedTrades()

    // active trades
    tradesElem.latestClosed.clear().draw();
    for (let i = 0; i < trades.length; i++) {
        tradesElem.latestClosed.row.add([
            i + 1,
            trades[i].app_id,
            trades[i].open_price,
            trades[i].close_price,
            trades[i].open_type + '<br/>' + trades[i].close_type,
            trades[i].base_vol,
            trades[i].created_at,
            trades[i].converted_sell_limit_at,
            trades[i].closed_at,
        ]).draw(false);
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
            trades.active[i].base_vol,
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
            trades.closed[i].base_vol,
            trades.closed[i].created_at,
            trades.closed[i].converted_sell_limit_at,
            trades.closed[i].closed_at,
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

// ajax call - get latest closed trades (for all applications)
function fetchLatestClosedTrades() {
    let resp = [];

    $.ajax({
        url: host + '/latest/trades/closed',
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

// ajax call - get latest closed trades (for all applications)
function fetchLatestBalances() {
    let resp = [];

    $.ajax({
        url: host + '/latest/balances',
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

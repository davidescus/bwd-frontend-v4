$(document).ready(function () {
    let headerButtons = $('.env');
    console.log("header buttons: ", headerButtons);
    headerButtons.on('click', function () {
        let h = $(this).attr('data-env');
        h === 'local' ? host = localhost : h === 'dev' ? host = dev : host = prod
        init();

        console.log("h: ", h);

        headerButtons.removeClass('btn-danger');
        $(this).addClass('btn-danger')
    });

    initTradesTables();

    init();
});

const localhost = 'http://localhost:8590';
const dev = 'http://163.172.133.0:8590';
const prod = 'http://51.15.242.149:8590';

let host = dev;
let activeApp = 0;
let tradesElem = null;

let intervalLatestBalances;
let intervalLatestTradesClosed;
let intervalTradesSection;

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

    // clear intervals
    clearInterval(intervalLatestBalances);
    clearInterval(intervalLatestTradesClosed);
    clearInterval(intervalTradesSection);

    // balance
    // TODO app specific balance
    // TODO general balance
    let latestBalancesElem = $('.latest-balances span');
    populateLatestBalances(latestBalancesElem);
    intervalLatestBalances = setInterval(function () {
        populateLatestBalances(latestBalancesElem);
    }, 2000);

    // latest closed trades
    populateLatestTradesClosed(tradesElem);
    intervalLatestTradesClosed =  setInterval(function() {
        populateLatestTradesClosed(tradesElem);
    }, 2000);

    // closed, active trades
    populateTradesSection(activeApp, tradesElem);
    intervalTradesSection = setInterval(function () {
        populateTradesSection(activeApp, tradesElem);
    }, 3000);

    // actions
    let appButtons = appsElem.find('button');
    appButtons.on('click', function () {
        activeApp = $(this).attr('data-id');
        populateTradesSection(activeApp, tradesElem);
        appButtons.removeClass('btn-danger');
        $(this).addClass('btn-danger')
    });
}

// generateAppsSection will generate buttons for each app
function generateAppsSection(apps, appsElem) {
    appsElem.html('');
    apps.forEach(function (app, i) {
        let className = i === 0 ? 'btn-danger' : '';
        let content = `
            <button class="btn btn-info btn-small ${className} "data-id="${app.id}">
                App: ${app.id} (${app.pair})
            </button>
        `;
        appsElem.append(content);
    });
}

function initTradesTables() {
    let container = $('.trades');

    tradesElem =  {
        active: container.find(".active table").DataTable({
            searching: false,
            "columnDefs": [
                {
                    "targets": 0,
                    "title": "Nr",
                    "data": "number",
                },
                {
                    "targets": 1,
                    "title": "Open",
                    "data": "openPrice",
                },
                {
                    "targets": 2,
                    "title": "Close",
                    "data": "closePrice",
                },
                {
                    "targets": 3,
                    "title": "Execution",
                    "data": "execution",
                },
                {
                    "targets": 4,
                    "title": "BVol",
                    "data": "baseVolume",
                },
                {
                    "targets": 5,
                    "title": "Created",
                    "data": "createdAt",
                },
                {
                    "targets": 6,
                    "title": "Converted Sell",
                    "data": "convertSellLimitAt",
                },
                {
                    "targets": 7,
                    "title": "QVol",
                    "data": "quoteVolume",
                },
            ]
        }),
        closed: container.find(".closed table").DataTable({
            searching: false,
            "columnDefs": [
                {
                    "targets": 0,
                    "title": "Nr",
                    "data": "number",
                },
                {
                    "targets": 1,
                    "title": "Open",
                    "data": "openPrice",
                },
                {
                    "targets": 2,
                    "title": "Close",
                    "data": "closePrice",
                },
                {
                    "targets": 3,
                    "title": "Execution",
                    "data": "execution",
                },
                {
                    "targets": 4,
                    "title": "BVol",
                    "data": "baseVolume",
                },
                {
                    "targets": 5,
                    "title": "Created",
                    "data": "createdAt",
                },
                {
                    "targets": 6,
                    "title": "ConvertedSell",
                    "data": "convertSellLimitAt",
                },
                {
                    "targets": 7,
                    "title": "ClosedAt",
                    "data": "closedAt",
                },
                {
                    "targets": 8,
                    "title": "QVol",
                    "data": "quoteVolume",
                },
            ]
        }),
        latestClosed: $(".latest-trades-closed table").DataTable({
            searching: false,
            lengthMenu: [5],
            ordering: false,
            info: false,
            bPaginate: false,
            "columnDefs": [
                {
                    "targets": 0,
                    "title": "Nr",
                    "data": "number",
                },
                {
                    "targets": 1,
                    "title": "AppID",
                    "data": "appId",
                },
                {
                    "targets": 2,
                    "title": "Open",
                    "data": "openPrice",
                },
                {
                    "targets": 3,
                    "title": "Close",
                    "data": "closePrice",
                },
                {
                    "targets": 4,
                    "title": "Execution",
                    "data": "execution",
                },
                {
                    "targets": 5,
                    "title": "BVol",
                    "data": "baseVolume",
                },
                {
                    "targets": 6,
                    "title": "Created",
                    "data": "createdAt",
                },
                {
                    "targets": 7,
                    "title": "ConvertedSell",
                    "data": "convertSellLimitAt",
                },
                {
                    "targets": 8,
                    "title": "ClosedAt",
                    "data": "closedAt",
                },
                {
                    "targets": 9,
                    "title": "QVol",
                    "data": "quoteVolume",
                },
            ]
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
    // ajax call fetch latest closed trades
    $.ajax({
        url: host + '/latest/trades/closed',
        type: 'GET',
        async: false,
        dataType: 'json',
        success: function (data, status, xhr) {
            let trades = data;

            let latestTrades = [];
            for (let i = 0; i < trades.length; i++) {
                latestTrades.push({
                    number: i + 1,
                    appId: trades[i].app_id,
                    openPrice: trades[i].open_price,
                    closePrice: trades[i].close_price,
                    execution: trades[i].open_type + ' / ' + trades[i].close_type,
                    baseVolume: trades[i].base_vol,
                    createdAt: trades[i].created_at,
                    convertSellLimitAt: trades[i].converted_sell_limit_at,
                    closedAt: trades[i].closed_at,
                    quoteVolume: (trades[i].open_price * trades[i].base_vol).toFixed(8),
                });
            }

            tradesElem.latestClosed.clear().rows.add(latestTrades).draw();
        },
        error: function (jqXhr, textStatus, errorMessage) {
            // TODO show error here
            alert(errorMessage)
        }
    });
}

function populateTradesSection(appId, tradesElem) {
    // ajax call for fetch and repopulate table
    $.ajax({
        url: host + '/' + appId + '/trades',
        type: 'GET',
        dataType: 'json',
        success: function (data, status, xhr) {
            let trades = data

            // active trades
            let activeTrades = [];
            for (let i = 0; i < trades.active.length; i++) {
                activeTrades.push({
                    number: i + 1,
                    openPrice: trades.active[i].open_price,
                    closePrice: trades.active[i].close_price,
                    execution: trades.active[i].open_type + ' / ' + trades.active[i].close_type,
                    baseVolume: trades.active[i].base_vol,
                    createdAt: trades.active[i].created_at,
                    convertSellLimitAt: trades.active[i].converted_sell_limit_at,
                    quoteVolume: (trades.active[i].open_price * trades.active[i].base_vol).toFixed(8),

                });
            }

            tradesElem.active.clear().rows.add(activeTrades).draw();

            // closed trades
            let closedTrades = [];
            for (let i = 0; i < trades.closed.length; i++) {
                closedTrades.push({
                    number: i + 1,
                    openPrice: trades.closed[i].open_price,
                    closePrice: trades.closed[i].close_price,
                    execution: trades.closed[i].open_type + ' / ' + trades.closed[i].close_type,
                    baseVolume: trades.closed[i].base_vol,
                    createdAt: trades.closed[i].created_at,
                    convertSellLimitAt: trades.closed[i].converted_sell_limit_at,
                    closedAt: trades.closed[i].closed_at,
                    quoteVolume: (trades.closed[i].open_price * trades.closed[i].base_vol).toFixed(8),
                });
            }

            tradesElem.closed.clear().rows.add(closedTrades).draw();
        },
        error: function (jqXhr, textStatus, errorMessage) {
            // TODO show error here
            alert(errorMessage)
        }
    });
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

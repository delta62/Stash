function addStash(name) {
    chrome.windows.get(chrome.windows.WINDOW_ID_CURRENT, {populate: true}, function(window) {

            /*
             * Save in the same format loading is done in. This reduces stash 
             * size.
             */
            var windowObj = {
                url: [],
                left: window.left,
                top: window.top,
                width: window.width,
                height: window.height,
                focused: true,
                incognito: window.incognito,
                type: window.type
            };
            for (i in window.tabs) {
                windowObj.url.push(window.tabs[i].url);
            }

            localStorage.setItem(name, JSON.stringify(windowObj));
            chrome.windows.remove(window.id);
    });
}

function loadStash(name) {
    chrome.windows.getCurrent({populate: true}, function(window) {
        if (window.tabs.length == 1 && 
            window.tabs[0].url == "chrome://newtab/") {
                // Restore the tabs in the current window
                var restoreObj = JSON.parse(localStorage.getItem(name));
                for (var i in restoreObj.url) {
                    chrome.tabs.create({
                        url: restoreObj.url[i]
                    });
                }

                // AH!
                chrome.windows.getCurrent({populate: true}, function(window) {
                    for (var i in window.tabs) {
                        if (window.tabs[i].url == "chrome://newtab/") {
                            chrome.tabs.remove(window.tabs[i].id);
                        }
                    }
                });
        } else {
            console.log('conditions failed.', window.tabs);
            chrome.windows.create(JSON.parse(localStorage.getItem(name)));
        }
    });
}

function removeStash(name) {
    localStorage.removeItem(name);
}

function createTable(incognitoMode) {
    var table = document.createElement('table');
    var thead = document.createElement('thead');
    var row = document.createElement('tr');
    var headerCell = document.createElement('th');

    headerCell.setAttribute('colspan', '2');
    headerCell.appendChild(document.createTextNode('Saved Stashes'));
    row.appendChild(headerCell);
    thead.appendChild(row);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    table.setAttribute('id', 'content');
    var matches = 0;
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        var jsonWindow = JSON.parse(localStorage.getItem(key));
        if (incognitoMode && jsonWindow.incognito) {
            tbody.appendChild(createRow(key));
            matches += 1;
        }
        if (!jsonWindow.incognito) {
            tbody.appendChild(createRow(key));
            matches += 1;
        }
    }

    if (matches) {
        return table;
    } else {
        var message = document.createElement('h4');
        message.setAttribute('id', 'content');
        var text = document.createTextNode('\u2014 No Stashes \u2014');
        message.appendChild(text);
        return message;
    }
}

function createRow(linkText) {
    if (typeof createRow.zebra === 'undefined')
        createRow.zebra = true;
    createRow.zebra = !createRow.zebra;
    var row = document.createElement('tr');
    if (createRow.zebra)
        row.setAttribute('class', 'zebra');

    var linkCell = createCell('a', linkText, stashClickHandler, {href: '#'});
    var closeCell = createCell('span', '\u2718', closeClickHandler);
    row.appendChild(linkCell);
    row.appendChild(closeCell);

    return row;
}

function createCell(tagName, text, callback, attrs) {
    var cell = document.createElement('td');
    var elem = document.createElement(tagName);

    elem.appendChild(document.createTextNode(text));
    elem.addEventListener('click', callback);
    if (attrs) {
        for (var i in attrs) {
            elem.setAttribute(i, attrs[i]);
        }
    }
    cell.appendChild(elem);

    return cell;
}

function showStashes() {
    var window = chrome.windows.getCurrent({populate: true}, function(window) {
        var content = document.getElementById('content');
        var body = document.getElementsByTagName('body')[0];
        if (content) {
            body.removeChild(content);
        }
        body.appendChild(createTable(window.incognito));
    });
}

function stashClickHandler(event) {
    loadStash(this.innerHTML);
}

function closeClickHandler(event) {
    var key = this.parentNode.parentNode.firstChild.firstChild.innerHTML;
    removeStash(key);
    showStashes();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('stash-name').addEventListener(
        'keyup', function(event) {
            if (event.keyCode == 13) {
                var stashName = document.getElementById('stash-name').value;
                addStash(stashName);
            }
    });

    showStashes();
});
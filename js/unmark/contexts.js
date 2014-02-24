unmark.context     = {};
unmark.current_tab = {};

unmark.context.check = function()
{
    unmark.ajax(unmark.paths.check, 'url=' + unmark.urlEncode(unmark.current_tab.url), 'GET', unmark.context.save, unmark.context.save);
};

// Handle the clicky clicks
unmark.context.chelseaHandler = function(info, tab)
{
    var is_page = (info.linkUrl === undefined) ? true : false;

    // For now only save pages
    // No easy way to get the link's page title
    if (tab && is_page === true) {
        unmark.current_tab = tab;
        unmark.ajax(unmark.paths.ping, '', 'GET', unmark.context.check, unmark.context.fail);
    }
};

unmark.context.fail = function(obj)
{
    var status = obj.status || -1;
    var err    = (status == '500' || status == '404' || obj.error === undefined) ? 'We could not save this page.' : (status == '403') ? 'Please log into your account first and then try again.' : obj.err;
    status     = (status > 0 && status != '403') ? ' (' + status + ')' : '';
    unmark.context.pushMessage('error', err + status);
};

unmark.context.pushMessage = function(type, msg)
{
    type = (type == 'error') ? 'Error' : (type == 'success') ? 'Success' : 'Notice';
    msg  = type + ': ' + msg;
    unmark.context.sendMessage(unmark.current_tab.id, {'message': msg, 'screen_width': unmark.current_tab.width, 'screen_height': unmark.current_tab.height, 'type': type.toLowerCase()}, 1)

    var color = (type == 'Error') ? '#ff0000' : '#000000';
    var text  = (type == 'Error') ? 'ERR' : 'OK';
    chrome.browserAction.setBadgeBackgroundColor({'color': color});
    chrome.browserAction.setBadgeText({'text': text});

    var timer = setTimeout(function()
    {
        chrome.browserAction.setBadgeText({'text': ''});
    }, 2500);
};

unmark.context.sendMessage = function(tab_id, obj, attempt)
{
    if (attempt <= 5) {
        chrome.tabs.sendMessage(tab_id, obj, function(res)
        {
            attempt += 1;
            unmark.context.sendMessage(tab_id, obj, attempt);
            //console.log(chrome.runtime.lastError);
        });
    }
    else {
        alert(obj.message);
    }
};

unmark.context.save = function(obj)
{
    if (obj.mark) {
        unmark.context.pushMessage('notice', 'This page already exists in your account.');
    }
    else {
        var url   = unmark.current_tab.url;
        var title = unmark.current_tab.title;
        var query = 'url=' + unmark.urlEncode(url) + '&title=' + unmark.urlEncode(title) + '&notes=' + unmark.urlEncode('#chrome');
        unmark.ajax(unmark.paths.add, query, 'POST', unmark.context.success, unmark.context.fail);
    }
};

unmark.context.success = function(obj)
{
    if (obj.errors) {
        for (var i in obj.errors) {
            unmark.context.pushMessage('error', obj.errors[i] + '(' + i +')');
            break;
        }
    }
    else if (obj.mark) {
        unmark.context.pushMessage('success', 'This page has been saved to unmark.');
    }
    else {
        unmark.context.pushMessage('error', {});
    }
};

/*
// Removed for now
chrome.contextMenus.create(
{
    'title'               : 'Save link to unmark',
    'documentUrlPatterns' : ['http://*', 'https://*'],
    'contexts'            : ['link'],
    'onclick'             : unmark.context.chelseaHandler
});
*/

chrome.contextMenus.create(
{
    'title'               : 'Quick save to Unmark',
    'documentUrlPatterns' : ['http://*/*', 'https://*/*'],
    'contexts'            : ['page','selection'],
    'onclick'             : unmark.context.chelseaHandler
});
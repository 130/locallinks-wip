function openLinkInCurrentTab(url)
{
  chrome.tabs.getSelected(null, function(selected_tab) {
    chrome.tabs.update(selected_tab.id, {url: url});
  });
}

function openLinkInNewForegroundTab(url)
{
  chrome.tabs.getSelected(null, function(selected_tab) {
    chrome.tabs.create(
      _propertiesForNewTab(url, selected_tab, {selected: true})
    );
  });
}

function openLinkInNewBackgroundTab(url)
{
  chrome.tabs.getSelected(null, function(selected_tab) {
    chrome.tabs.create(
      _propertiesForNewTab(url, selected_tab, {selected: false})
    );
  });
}

function _propertiesForNewTab(
  url,
  base_tab,
  overriding_properties // optional
)
{
  if (typeof overriding_properties === 'undefined')
  {
    overriding_properties = {};
  }

  // I want to emulate native Chrome behavior.
  // So I will open new tab adjacent to base.
  return $.extend(true, // deep copy
  {
    windowId: base_tab.windowId,
    index:    base_tab.index + 1,
    url:      url,
  }, overriding_properties);
}

var flag = 'Chrome_LocalLinks_extension_was_already_injected_in_this_document';
if (!document[flag])
{
  // Chrome (as for Chromium 5.0.351.0) doesn't fire 'click' event when middle
  // button is pressed. So unified handling of left/middle mouse clicks should
  // be based on 'mousedown'/'mouseup' events.
  //
  // Mouse click recognized as sequence of:
  //   * 'mousedown'
  //   * 'mouseup' on the SAME element
  //
  // Also 'mouseout' shouldn't occurs between 'mousedown' and 'mouseup'.
  //
  // 'click' event is handled for partial Chrome messages suppressing
  // (as said before, it works only for left mouse click).
  $('a[href^=file://]').
    live('mousedown', handleMousedownOnLink).
    live('mouseout',  handleMouseoutOnLink).
    live('mouseup',   handleMouseupOnLink).
    live('click',     handleClickOnLink)
  document[flag] = true;
}

var element_of_last_mousedown = null;

function handleMousedownOnLink(event)
{
  element_of_last_mousedown = this;
}

function handleMouseoutOnLink(event)
{
  element_of_last_mousedown = null;
}

/* 10.07.2010 NB!*/
/* $.getScript should work after bug http://crbug.com/41024 will be fixed */
//$.getScript(chrome.extension.getURL('background_page/tab_kind.js'));
var CURRENT_TAB        = 'current_tab';
var NEW_FOREGROUND_TAB = 'new_foreground_tab';
var NEW_BACKGROUND_TAB = 'new_background_tab';

function _isTargetBlank(el)
{
  var element_has_target_blank = (el.target && el.target == '_blank');

  // Document can have many <base target="<smth>" /> elements and each
  // consequent overrides previous.
  var base_target_blank = false;
  $('head > base'). each(function(){
    // Check only '<base ... target='<smth>' />'.
    if (this.target)
    {
      // Override previous value.
      base_target_blank = (this.target == '_blank');
    }
  });

  return (element_has_target_blank || base_target_blank);
}

function handleMouseupOnLink(event)
{
  if (element_of_last_mousedown != this) return;

  var target_tab = null;
  switch (event.which)
  {
    case 1: // left button
      if (_isTargetBlank(this))
      {
        target_tab = NEW_FOREGROUND_TAB;
      }
      else
      {
        target_tab = CURRENT_TAB;
      }
      break;
    case 2: // middle button
      target_tab = NEW_BACKGROUND_TAB;
      break;
  }

  openUrl(target_tab, this.href);
}

function handleClickOnLink(event)
{
  // suppress Chrome error message in JavaScript console
  // ('Not allowed to load local resource: file://...')
  event.preventDefault();
}

function openUrl(target_tab, url)
{
  chrome.extension.sendRequest({
    target_tab: target_tab,
    url:        url
  });
}


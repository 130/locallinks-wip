// === General behavior ===

// Execute, when page will be completely loaded.
$(function(){
  initialize_settings();

  // Handle clicking on tab:
  $("#pane > ul > li a").click(function(event){
    // * Change selected tab.
    $(this).parent() // i.e. #pane > ul > li
      .addClass("tab-selected")
      .siblings(".tab-selected").removeClass("tab-selected");

    // * Show selected tab content and hide previously selected tab content.
    $("#pane > div")
      .filter(this.getAttribute("href")).addClass("pane-selected")
      .siblings(".pane-selected").removeClass("pane-selected");

    // * Prevent following bogus link.
    event.preventDefault();
  })

  show_stored_whitelist_rules(
    locallinks.storage.get("whitelist"),
    "#whitelist > tbody"
  );

  // Handle hotkeys for adding new rule to whitelist.
  $("body").keydown(function(event){
    if ((13 == event.which || 45 == event.which) // Enter or Insert
        && this === event.target)
    {
      add_new_rule_to_whitelist();
    }
  });

  // Handle clicking on button `add rule`.
  $("#whitelist-add-rule").click(function(event) {
    add_new_rule_to_whitelist();
    // Prevent handling of event *click.in_editing_mode* 
    // (see functions `start_editing_mode`/`finish_editing_mode`).
    event.stopPropagation();
  });

  // Handle actions with whitelist rules:
  $("#whitelist > tbody")
    // * Reorder rules.
    .delegate("tr", "mousedown", whitelist_tr_mousedown_handler)
    // * Edit or delete rule.
    .delegate("td", "click", whitelist_td_click_handler);

  // Show or hide help topics after clicking on topic header.
  $("#help > h3 a").click(function(){
    $(this).parent().nextUntil("h3").toggle();
  });

  // Show or hide CHANGELOG after clicking on appropriate element.
  $("#changelog-toggle").click(function(){
    $("#changelog-content").toggle("fast");
  });
});

// === Event handlers ===

// #### With clicking on whitelist rule cell, user can edit or delete rule.
// ------------------------------------------------------------------------
function whitelist_td_click_handler(event)
{
  // Get parent row of clicked cell.
  var tr = $(this).parent();

  // If clicked row is the row with currently edited rule, do nothing.
  if (in_editing_mode() && $(get_edited_tr()).get(0) === tr.get(0))
  {
    return;
  }

  // Check for external request of one-off prevention of editing after click.
  if ($(this).data("prevent_editing"))
  {
    $(this).removeData("prevent_editing");
    return;
  }

  // Stop editing of any other rule (with reverting changes).
  finish_editing_mode(replace_content_with_original_text);

  // Delete row with rule on `Alt-Click`.
  if (event.altKey)
  {
    tr.fadeOut('slow', function(){
      var table_container = $(this).parent()
      $(this).remove();
      store_whitelist_rules(table_container);
    });
  }
  // or start editing.
  else start_editing_mode(tr, this);
}

// #### With pressing and holding left mouse button, user can reorder rules.
// (i.e. move selected rule up or down on mouse movement)
// - - ---------------------------------------------------------------------
function whitelist_tr_mousedown_handler(event)
{
  // Proceed only if exactly left mouse button was pressed.
  if (1 != event.which)
  {
    return;
  }

  // If any rule is currently editing, then check, should `mousedown` handling
  // be discarded.
  if (in_editing_mode())
  {
    // Get row with currently edited rule.
    var edited_tr = $(get_edited_tr()).get(0);

    // If mouse button was pressed while pointing on currently edited rule, do
    // nothing (`mousedown` event could be generated on the edited row or on
    // edited row's child).
    if (edited_tr === event.target || $.contains(edited_tr, event.target))
    {
      return;
    }
  }

  // Get row, over which mouse button was pressed, and current mouse position.
  var tr = $(this);
  var lastY = event.pageY;

  // Start moving whitelist row when:

  // * Left mouse button was pressed for a long time.
  //   Don't react on short-time pressing of left mouse button,
  //   which is, most probably, just part of *click for editing rule*.
  var delayed_reaction_for_mousedown = setTimeout(function() {
    tr.unbind("mouseleave.start_moving_row");
    start_moving_whitelist_row(tr, lastY);
  }, 400 /* msec */);

  // * Mouse pointer leaves row, over which left mouse button was (and still)
  //   pressed.
  tr.bind("mouseleave.start_moving_row", function(event){
    clearTimeout(delayed_reaction_for_mousedown);
    tr.unbind("mouseleave.start_moving_row");
    start_moving_whitelist_row(tr, lastY);
  });

  // After releasing of mouse button undo planned actions.
  $(document).bind("mouseup.undo_delayed_reaction_for_mousedown", function(){
    clearTimeout(delayed_reaction_for_mousedown);
    tr.unbind("mouseleave.start_moving_row");
    $(document).unbind("mouseup.undo_delayed_reaction_for_mousedown");
  });

  // Prevent selecting text on mouse movement with pressed left mouse button.
  event.preventDefault();
}

// === Whitelist interface reactions ===

// #### Preparations for moving whitelist row (in process of reordering).
// ----------------------------------------------------------------------
function start_moving_whitelist_row(tr, lastY)
{
  // Get all whitelist rows except currently moved row.
  var all_other_trs = $("tr", tr.parent()).not(tr);

  // Stop editing of any rule (with reverting changes).
  finish_editing_mode(replace_content_with_original_text);

  // Visually select moved row;
  tr.addClass("moved-row");

  // When mouse pointer enters any other row (except currently moved),
  // swap entered row with moved row.
  all_other_trs.bind("mouseenter.on_dropping_moved_row", function(event){
    if (event.pageY > lastY) $(this).after(tr);
    else $(this).before(tr);

    lastY = event.pageY;
  })

  // On releasing mouse button:
  $(document).bind("mouseup.stop_moving_row", function(event) {
    // * Visually deselect moved row.
    tr.removeClass("moved-row");

    // * *mousedown* + *mouseup* => *click*.
    //   Set request for one-off prevention of editing after clicking rule
    //   cell.
    if ($.inArray(event.target, tr.children("td")) != -1)
    {
      $(event.target).data("prevent_editing", true);
    }

    store_whitelist_rules(tr.parent());

    // * Unbind auxiliary (and no more needed) event handlers.
    all_other_trs.unbind("mouseenter.on_dropping_moved_row");
    $(document).unbind("mouseup.stop_moving_row");
  })
}

// #### Preparations for editing of whitelist rule.
// ------------------------------------------------
function start_editing_mode(edited_tr, edited_td)
{
  var edited_tds = $(edited_tr).children("td");

  if (in_editing_mode())
  {
    return;
  }

  in_editing_mode(edited_tr);

  edited_tds.each(replace_content_with_text_type_input);

  $(document).bind("click.in_editing_mode", function(){
    if ($(event.target).parents("tr").get(0) !== $(edited_tr).get(0))
    {
      finish_editing_mode(replace_content_with_original_text);
    }
  });

  $(edited_tr).find("input").keydown(function(event){
    if (13 == event.which) // Enter
    {
      finish_editing_mode(replace_content_with_input_text);
    }
    if (27 == event.which) // Esc
    {
      finish_editing_mode(replace_content_with_original_text);
    }
  });

  $("input", $(edited_td)).focus();
}

// #### Preparations for finishing editing of whitelist rule.
// ----------------------------------------------------------
function finish_editing_mode(replace_td_content_callback)
{
  if (!in_editing_mode())
  {
    return;
  }

  var edited_tr = $(get_edited_tr())
  var edited_tds = edited_tr.children("td")
  var all_edited_tds_are_empty = true;

  edited_tds.each(function(){
    replace_td_content_callback.call(this);
    all_edited_tds_are_empty &= !$(this).text().length;
  });

  if (all_edited_tds_are_empty)
  {
    $(edited_tr).remove();
  }

  $(document).unbind("click.in_editing_mode");

  in_editing_mode(false);

  store_whitelist_rules(edited_tr.parent());
}

// === Helper functions ===

function initialize_settings()
{
  _({
    "whitelist": [
      {address: "*", handled_schemes: ["file://"]},
    ]
  }).each(function(setting_value, setting_key){
    if (_(locallinks.storage.get(setting_key)).isUndefined())
    {
      locallinks.storage.set(setting_key, setting_value);
    }
  });
}

function show_stored_whitelist_rules(whitelist_rules, table_container)
{
  if(_(whitelist_rules).isUndefined())
  {
    return;
  }

  var table = $(table_container);
  table.children("tr").remove();

  _(whitelist_rules).each(function(rule){
    var textualized_rule = _(rule).clone();
    textualized_rule.handled_schemes = rule.handled_schemes.join(", ");

    table.append(_.template(
      "<tr><td><%= address %></td><td><%= handled_schemes %></td></tr>",
      textualized_rule
    ));
  });
}

function store_whitelist_rules(table_container)
{
  var rules = $(table_container).children("tr").map(function(){
    var cells =
      $(this).children("td").map(function() { return $(this).text(); });
    return {
      address:         cells[0],
      handled_schemes: _(cells[1].split(",")).invoke("trim")
    }
  });

  locallinks.storage.set("whitelist", rules.get());
}

// #### Check, if we are in editing mode, or set editing mode flag.
// ----------------------------------------------------------------
function in_editing_mode(edited_tr)
{
  var whitelist = $("#whitelist");

  if (edited_tr === undefined)
  {
    return ($(whitelist.data("in_editing_mode")).length > 0);
  }

  whitelist.data("in_editing_mode", edited_tr);
}

// #### Return currently edited row.
// ---------------------------------
function get_edited_tr()
{
  return $("#whitelist").data("in_editing_mode");
}

function add_new_rule_to_whitelist()
{
  var whitelist_tbody = $("#whitelist > tbody");

  if (in_editing_mode())
  {
    whitelist_tbody.find("input").first().focus();
    return;
  }

  whitelist_tbody.prepend("<tr><td></td><td></td></tr>");
  var added_tr = whitelist_tbody.find("tr").first();

  start_editing_mode(added_tr, added_tr.children("td").first());
}

function replace_content_with_text_type_input()
{
  var text = $(this).text();
  $(this).html('<input type="text"></input>');
  $("input", this)
    .val(text)
    .data("original_text", text);
}

function replace_content_with_original_text()
{
  var text = $("input", this).first().data("original_text");
  $(this).html("").text(text);
}

function replace_content_with_input_text()
{
  var text = $("input", this).first().val();
  $(this).html("").text(text);
}


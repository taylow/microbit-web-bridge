function hideTerminal() {
  let size = $(window).width() < 480 ? 80 : 20;
  $('#terminal-container').animate({
    'left': `-${size}%`
  }, {queue: false});
}

function hideHistory() {
  $('#history-container').animate({
    'left': '100%'
  }, {queue: false});
}

/***
 * Slides in or out the terminal panel once the invisible checkbox is changed.
 */
$('#terminal-checkbox').change(function (change) {
  if ($(window).width() < 480) {
    hideHistory()
  }
  if (change.target.checked)
    $('#terminal-container').animate({
      'left': '0px'
    }, {queue: false});
  else {
    hideTerminal();
  }
});

/***
 * Slides in or out the history panel once the invisible checkbox is changed.
 */
$('#history-checkbox').change(function (change) {
  let size = 80
  if ($(window).width() < 480) {
    size = 20;
    hideTerminal()
  }

  if (change.target.checked)
    $('#history-container').animate({
      'left': `${size}%`
    }, {queue: false});
  else
    hideHistory();
});
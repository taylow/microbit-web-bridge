/***
 * Slides in or out the terminal panel once the invisible checkbox is changed.
 */
$('#terminal-checkbox').change(function(change){
    if(change.target.checked)
        $('#terminal-container').animate({
            'left': '0px'
        });
    else
        $('#terminal-container').animate({
            'left': '-20%'
        });
});

/***
 * Slides in or out the history panel once the invisible checkbox is changed.
 */
$('#history-checkbox').change(function(change){
    if(change.target.checked)
        $('#history-container').animate({
            'left': '80%'
        });
    else
        $('#history-container').animate({
            'left': '100%'
        });
});
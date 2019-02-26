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
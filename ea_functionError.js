function eaErrorMessage (expected, found, cure, caller) {
    console.error ('\n\nError in',caller);
    console.error ('Expecting',expected);
    console.error ('Found',found);
    console.error ('Cure',cure);
    var stack = new Error().stack;
    console.error ('stack',stack);
    throw "exit";
}

function eaLogErrorOfHash (err, hash) {
    let [callee, caller] = functionNameJS();
    console.log('Entering in',callee,'called by',caller);
    console.log(callee+'.input.err:',err);
    console.log(callee+'input.hash:',hash);
    
    const message = err.message;
    console.log(callee+'.message:',message);
    updateInnerHTMLOfIdOfValue("SpanErrorId", message); // Improve
    
    switch (message){
    case "Internal Server Error":
	var text = "Internal Server Error because ipfs file path was uncorrect<br>run : ipfs pin add "+hash;
	updateInnerHTMLOfIdOfValue("SpanErrorId", text);
	break;
    default:
	console.log(callee+'.default.err:',err);
    } // switch
}
function eaLogError (err) {
    let [callee, caller] = functionNameJS();
    console.log('Entering in',callee,'called by',caller);
    console.log(callee+'.input.err:',err);
    
    const message = err.message;
    console.log(callee+'message',message);
    updateInnerHTMLOfIdOfValue("SpanErrorId", message);
    switch (message){
	
    case "NetworkError when attempting to fetch resource.":
	var text = "NetworkError because ipfs has not been launched<br>run : jsm; . config.sh; ipmsd.sh";
	console.error(text);
	break;
	
    case "Failed to fetch":
	var text = "NetworkError because ipfs has not been launched<br>run :cd minichain ; . config.sh";
	console.error(text);
	break;	     
	
    case "Internal Server Error":
	return false;
	break;
	
    case "Cannot read property 'length' of null":
	console.error('Cannot read property length of null');
	break;
	
    case "entries is null":
	break;

    default:
	console.log(callee+'"default err:',);
    } // switch
}

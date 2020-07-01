
// assumed api_url is already defined ...

ipfsVersion()
    .then (obj => ipfsversion = obj)

function ipfsVersion() {
    let [callee, caller] = functionNameJS();
    
    let url = api_url + 'version'
    console.log(callee+'.url: ',url);
    return fetchGetPostJson(url)
	.then( obj => { console.log(callee+'.obj: ',obj);
		 return obj.Version; })
	.catch(console.error)
	    }

function getInputValue(id) {
    let [callee, caller] = functionNameJS();
    
    let e = document.getElementById(id);
    if (typeof(e) !=  'undefined') {
	return e.value
    } else {
	let [callee, caller] = functionNameJS();
	console.error(callee+'.id: '+id+ 'not found');
    }
}

async function getStatofMfsPath(mfs_path) {
    let [callee, caller] = functionNameJS();
    let url = api_url + 'files/stat?arg='+mfs_path+'&hash=true&type=true'
    return fetchGetPostJson(url)
	.then(obj => {
	    obj.Type = obj.Type.charAt(0).toUpperCase() + obj.Type.slice(1);
	    console.log(callee+'.obj: ',obj);
	    return obj;
	})
	.catch(console.error)
	    }  

async function provide_directory_content() {
    let [callee, caller] = functionNameJS();
    
    let item = await provideItem('curItem')
    console.log(callee+'.item: ',item)
    console.log(callee+':directory_content needs curItem')
    console.log(callee+':item.Path needs curItem')
    
    let mfs_path = item.Path
    let immutable = mfs_path.match(new RegExp('/ip[fn]s'))
    if (immutable) {
	mfs_path = mfs_path.replace(new RegExp('[^/]+/\.\./'),'') // TBD
    } else {
	mfs_path = mfs_path.replace(new RegExp('[^/]+/\.\./'),'')
    }
    
    // build directory content ...
    return build_directory_content(mfs_path);
}

function build_directory_content(mfs_path) {
    let [callee, caller] = functionNameJS(); // logInfo("message !")

    let parent_path = mfs_path + '../';
    let immutable = mfs_path.match(new RegExp('/ip[fn]s'))
    console.log(callee+'.immutable: ',immutable)

    if (mfs_path == '/' || immutable) {
	parent_path = '/';
    }
    console.log(callee+'.parent_path: '+parent_path)
    console.log(callee+':parent_hash needs parent_path')
    let promise_parent_hash = getHashofMfsPath(parent_path)

    let url; // .. long=true for IPFS 0.5
    let promise_directory_content
    if ( immutable ) {
	url = api_url + 'file/ls?arg='+mfs_path
	promise_directory_content = fetchRespCatch(url)
	    .then( json => {
		console.log(callee+'.immutable.ls.json: ',json)
		let hash = json.Arguments[mfs_path]
		let content = json.Objects[hash].Links
		console.log(callee+'.file.ls: ',content)
		json.Entries = content; // map as if it was a "files/ls" API call
		const typetonum = { 'Directory': 1,'File': 0 }
		json.Entries.forEach( e => { e.Type = typetonum[e.Type] } )
		return json;
	    })
	
    } else if ( ipfsversion == '0.4.22') {
	url = api_url + 'files/ls?arg='+mfs_path+'&l=true&U=true'
	promise_directory_content = fetchRespCatch(url)
	    .then ()
    } else {
	url = api_url + 'files/ls?arg='+mfs_path+'&long=true&U=true'
	promise_directory_content = fetchRespCatch(url)
	    .then ()
    }

    console.log(callee+':directory_content needs mfs_path')
    
    return Promise.all([promise_parent_hash,promise_directory_content]) 
	.then(_ => {
	    [parent_hash, obj] = _
	    console.log(callee+'.promise.results: ',_);
	    let table_of_content = obj.Entries;
	    table_of_content.forEach( e => { e.Type = ['File','Directory'][e.Type] } )
	    if (table_of_content == null) {
		table_of_content = [];
	    }
	    let parent_item = { Name:'..', Type:'Directory', Size:0, Hash:parent_hash, Path:mfs_path }
	    console.log(callee+'.parent_item: ',parent_item);
	    table_of_content.unshift(parent_item)
	    console.log(callee+'.TOC:',table_of_content);
	    return { "dirname":mfs_path, "parent":parent_hash, "TOC":table_of_content };


	})
	.catch( obj => { logError(callee+'.catch',obj) })
	    }

function getHashofMfsPath(mfs_path) {
    let [callee, caller] = functionNameJS();
    
    let  url = api_url + 'files/stat?arg='+mfs_path+'&hash=true'
    return fetchGetPostJson(url) // get
	.then( json => {
            return json.Hash
	})
}

function provide_file_content() {
    let [callee, caller] = functionNameJS();

    console.log(callee+':file_content needs mfs_pathinputid')
    let mfs_path = getInputValue('mfs_pathinputid');
    return getContentofMfsPath(mfs_path);
}

async function provideItem(ofwhat) {
    let [callee, caller] = functionNameJS(); // logInfo("message !")
    console.log(callee+'.input.ofwhat:',ofwhat);
    
    if (typeof(stored[ofwhat]) != 'undefined') {  
	return stored[ofwhat]

    } else if (ofwhat == 'curItem') {
	// created (build)
	console.log(callee+':curItem needs mfs_pathinputid')
	let mfs_path = getInputValue('mfs_pathinputid'); // provide Input !
	var stat = await getStatofMfsPath(mfs_path);

	let item = stat;
	item.Path = mfs_path
	let slash = mfs_path.lastIndexOf('/')
	item.DirName = mfs_path.substring(0,slash+1);
	item.Name = mfs_path.substr(slash+1);
	console.log(callee+'.item:',item);
	stored[ofwhat] = item;
	console.log(callee+'.item:',item)
	console.log(callee+' item => stored[',ofwhat,']');
	return item;
    } else {
	throw "Error: "+ofwhat+" not previously stored !";
    }
}

function providePinFullStatus(ofwhat) {
    let [callee, caller] = functionNameJS(); // logInfo("message !")

    let hash = stored[ofwhat].Hash;
    console.log(callee+'.hash:',hash)
    console.log(callee+' hash <= stored[',ofwhat,'].Hash');

    return getPinStatus(hash);
}

async function providePinStatusThrough(ofwhat) {
    let [callee, caller] = functionNameJS();
    
    let hash;
    if (ofwhat == 'item') {
	hash = stored[ofwhat].Hash;
	console.log(callee+'.hash:',hash)
	console.log(callee+' hash <= stored[',ofwhat,'].Hash');
	
	let pin_full_status = await getPinStatus(hash);
	let pin_split_status = splitPinFullStatus(pin_full_status)
	return pin_split_status;
    }
}

/* to be deleted
async function providePinStatus(ofwhat) {
    let [callee, caller] = functionNameJS();
    
    let pin_status;
    [pin_status, _] = await providePinStatusThrough(ofwhat) // provide
    return pin_status;

}
async function provideThrough(ofwhat) {
    let [callee, caller] = functionNameJS();
    
    let pin_through;
    [_,pin_through] = await providePinStatusThrough(ofwhat) // provide
    return pin_through;
}
*/

function splitPinFullStatus(fullstatus) {
    let [callee, caller] = functionNameJS();
    console.log(callee+'.input.fullstatus: ',fullstatus)
    
    let matches = fullstatus.match(/(\w+)\s+through (\w+)/)
    console.log(callee+'.matches: ',matches)
    
    let pin_status
    let qm_through
    if (matches) {
	pin_status = matches[1]
	qm_through = matches[2]
	console.log(callee+'.pin_status:',pin_status)
	console.log(callee+'.qm_through: '+qm_through )
    } else {
	pin_status = fullstatus
	if (pin_status == 'unpinned') {
	    qm_through = 'QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH'
	} else {
	    qm_through = null
	}
    }
    console.log(callee+'.pin_status:',pin_status)
    console.log(callee+'.qm_through:',qm_through)
    
    return [pin_status,qm_through]
}

async function provideHashofMfsPath(ofwhat) {
    let [callee, caller] = functionNameJS(); // logInfo("message !")

    if (typeof(stored[ofwhat].Hash) != 'undefined') {
	console.log(callee+' hash <= stored[',ofwhat,'].Hash');

	return stored[ofwhat].Hash
    } else {
	let mfs_path = stored[ofwhat].mfs_path
	console.log(callee+' mfs_path <= stored[',ofwhat,'].mfs_path');
	console.log(callee+'.stored['+ofwhat+']: ',stored[ofwhat]);
	console.log(callee+'.mfs_path: ',mfs_path);
	let  url = api_url + 'files/stat?arg='+mfs_path+'&hash=true'
	let hash = await fetchGetPostJson(url) // build/get
	    .then( json => {
		stored[ofwhat].Hash = json.Hash
		return json.Hash
	    })
	    .catch( console.error )
		return hash;
    }
}

function getPinStatus(hash) { // getdata
    let [callee, caller] = functionNameJS(); // logInfo("message !")

    let  url = api_url + 'pin/ls?arg=/ipfs/'+hash+'&type=all'
    return fetchRespNoCatch(url)
	.then( obj => {
	    let status;
	    if (typeof(obj.Code) == 'undefined') {
		status = obj.Keys[hash].Type
	    } else {
		status = 'unpinned'
	    }
	    console.log(callee+'.hash'+hash+" \u21A6",status);
	    return Promise.resolve(status)
	})
	.catch( obj => { logError('getPinStatus.catch',obj) })
	    }

function togglePinStatus(status, hash) {
    let [callee, caller] = functionNameJS(); // logInfo("message !")
    console.log(callee+'.input.status:',status);
    console.log(callee+'.input.hash:',hash);
    
    if (status == 'unpinned' || status == 'indirect') {
	return ipfsPinAdd(hash)
	    .then( _ => { return getPinStatus(hash)})

    } else if (status == 'direct' || status == 'recursive' || status == 'indirect-not-through')  {
	return ipfsPinRm(hash)
	    .then( _ => { return getPinStatus(hash)})
    } else {
	console.log(callee+'.status:',status);
	return Promise.resolve('???');
    }
}


function ipfsPinAdd(hash) {
    let [callee, caller] = functionNameJS();
    
    let url = api_url + 'pin/add?arg=/ipfs/'+hash+'&progress=true'
    return fetchGetPostText(url)
	.then(text => { console.log('ipfsPinAdd.text',text); })
	.catch(err => console.error(err, hash))
	    }

function ipfsPinRm(hash) {
    let [callee, caller] = functionNameJS();
    
    let url = api_url + 'pin/rm?arg=/ipfs/'+hash
    console.log('ipfsPinRm.url',url)
    return fetchGetPostJson(url)
	.then( json => { console.log('ipfsPinRm.json',json);
			 return json.Pins  // Improve when recursive ?
		       })
	.catch(err => console.error(err, hash))
	    } 


function getContentofMfsPath(mfsPath) {
    let [callee, caller] = functionNameJS();
    
    let  url = api_url + 'files/read?arg='+mfsPath
    return fetchRespCatch(url)
}



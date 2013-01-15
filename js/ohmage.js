var oh = oh || {};
oh.utils = oh.utils || {};

oh.utils.getRandomSubarray = function(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor(i * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

oh.utils.delayexec = function(){
	var timer;
	function exec(call, delay){
		dashboard.message("clear " + timer)
		clearTimeout(timer);
		timer = setTimeout(call, delay);
		dashboard.message("added " + timer)		
	};
	return exec;
}

oh.utils.state = function(mycampaign, myresponse){
	if(!mycampaign){
		return window.location.hash.substring(1).split("/");
	} 
	if(!myresponse){
		window.location.hash = mycampaign;
		return;
	}
	window.location.hash = mycampaign + "/" + myresponse;
}

oh.call = function(path, data, datafun){
	
	function processError(errors){
		if(errors[0].code && errors[0].code == "0200"){
			oh.sendtologin();
			var pattern = /(is unknown)|(authentication token)|(not provided)/i;
			if(errors[0].text.match(pattern)) return;
			alert(errors[0].text)
		} else {
			alert(errors[0].text)
		}
	}	
	
	//input processing
	var data = data ? data : {};		
	
	//default parameter
	data.client = "dashboard"
		
	var myrequest = $.ajax({
		type: "POST",
		url : "/app" + path,
		data: data,
		dataType: "text",
		xhrFields: {
			withCredentials: true
		}
	}).done(function(rsptxt) {
		if(!rsptxt || rsptxt == ""){
			alert("Undefined error.")
			return false;
		}
		var response = jQuery.parseJSON(rsptxt);
		if(response.result == "success"){
			if(datafun) datafun(response)
		} else if(response.result == "failure") {
			processError(response.errors)
			return false;
		} else{
			alert("JSON response did not contain result attribute.")
		}
		
	}).error(function(){alert("Ohmage returned an undefined error.")});		
	
	return(myrequest)
}

oh.login = function(user, password, cb){
	var req = oh.call("/user/auth_token", { 
		user: user, 
		password: password
	}, function(response){
		if(!cb) return;
		cb()
	})
	return req;
}

oh.logout = function(cb){
	oh.call("/user/logout", {}, cb);
}

oh.sendtologin = function(){
	var next = "login.html"
	if(location.hash) {
		next = next + "?state=" +  location.hash.substring(1);
	}
	window.location = next;
}

oh.campaign_read = function(cb){
	var req = oh.call("/campaign/read", {
		output_format : "short"
	}, function(res){
		if(!cb) return;
		var arg = (res.metadata && res.metadata.items) ? res.metadata.items : null;
		cb(arg)
	});
	return req;
};

oh.init = function(){
	if(oh.utils.state()[0] == "demo"){
		$("#loadinganimation").show();
		oh.initdemo();
	} else {
		oh.campaign_read(function(campaigns){
			var pattern = /snack/i;
			var snackcampaigns = [];
			campaigns.forEach(function(o){
				if(pattern.test(o)){
					snackcampaigns.push(o);
				}
			});
			if(snackcampaigns.length == 0){
				alert("No valid snack campaign found :(");
			} else {
				if($.inArray(oh.utils.state()[0], snackcampaigns) > -1){
					//select the campaign from the hashtag
					dashboard.campaign_urn = oh.utils.state()[0];
				} else {
					//pick a random campaign from available snack campaigns
					dashboard.campaign_urn = snackcampaigns[Math.floor(Math.random()*snackcampaigns.length)];	
					oh.utils.state(dashboard.campaign_urn);
				};
				$("#loadinganimation").show();
				oh.snackread(dashboard.campaign_urn);
			}
		});
	}
}

oh.initdemo = function(max){
	var myrequest = $.ajax({
		type: "GET",
		url : "data/demo/snack.csv"
	});
	
	myrequest.error(function(){
		alert("Failed to download demo data.")
	});	

	myrequest.done(function(rsptxt) {
		dashboard.campaign_urn = "demo"
		oh.parsecsv(rsptxt, max)
	});	
}

oh.parsecsv = function(string, max){
	//dependency on d3!
	var rows = d3.csv.parse(string);
	
	//get head of data
	if(max) {
		rows = oh.utils.getRandomSubarray(rows, max);
	}

	//parse rows
	var records = [];
	rows.forEach(function(d, i) {
		//alert(JSON.stringify({latlng : [parseFloat(d["context:location:latitude"]), parseFloat(d["context:location:longitude"])]}))
		records.push({
			date : d["context:timestamp"] ? new Date(d["context:timestamp"].replace(" ","T")) : null,
			prompt_id_WhoYouSnackWith : d["WhoYouSnackWith:label"],
			prompt_id_SnackCost : d["SnackCost:label"],
			prompt_id_SnackPeriod : d["SnackPeriod:label"],
			prompt_id_SnackLocation : d["SnackLocation:label"],
			prompt_id_HealthyLevel : d["HealthyLevel"],
			latlng : d["context:location:latitude"] ? [parseFloat(d["context:location:latitude"]), parseFloat(d["context:location:longitude"])] : null,
			user_id : d["user:id"], //required for image read?
			neighborhood : d["neighborhood"], //required for image read?
			prompt_id_WhatSnack : d["WhatSnack"],
			prompt_id_WhySnack : d["WhySnack"],
			prompt_id_SnackImage : d["SnackImage"],
			hash : murmurhash3_32_gc(JSON.stringify(d))
		});
	});
	
	//load into gui
	loaddata(records)
}

oh.snackread = function(campaign_arg){

	var myrequest = $.ajax({
		type: "POST",
		url : "/app/survey_response/read",
		data: {
			campaign_urn : campaign_arg,
			client : "dashboard",
			user_list : "urn:ohmage:special:all",
			prompt_id_list : "urn:ohmage:special:all",
			output_format : "csv",
			sort_oder : "timestamp",
			column_list : "" + [
				"urn:ohmage:context:timestamp",
				"urn:ohmage:prompt:response",
				"urn:ohmage:context:location:latitude",
				"urn:ohmage:context:location:longitude"
			],
			suppress_metadata : "true"
		},
		dataType: "text",
		xhrFields: {
			withCredentials: true
		}
	});
	
	myrequest.error(function(){
		alert("Failed to download responses from Ohmage.")
	});
	
	myrequest.done(function(rsptxt) {
		if(!rsptxt || rsptxt == ""){
			alert("Undefined error.")
			return false;
		} else {
			oh.parsecsv(rsptxt)
		}
	});
}

oh.getimageurl = function(record){	
	if(!record["prompt_id_SnackImage"] || record["prompt_id_SnackImage"] == "SKIPPED" || record["prompt_id_SnackImage"] == "NOT_DISPLAYED"){
		return "images/nophoto.jpg"
	} 		
	if(dashboard.campaign_urn == "demo"){
		return "data/demo/photos/" + record["prompt_id_SnackImage"] + ".jpg";
	} else { 
		return "/app/image/read?client=dashboard&id=" + record["prompt_id_SnackImage"];
	}
}	
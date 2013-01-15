var loaddata = function(records){
	
	// load data
	var snack = crossfilter(records);
	dashboard.snack = snack;
	
	//crossfilter dashboard.dim	
    var date = snack.dimension(function(d) { 
    	  return d.date ? d3.time.day(d["date"]) : null; 
    });
    
    var hour = snack.dimension(function(d) {
    	return d.date ? (d["date"].getHours() + d["date"].getMinutes() / 60) : null;
    });
    
    var area = snack.dimension(function(d) {
    	return d["neighborhood"];
    });
    
    var who = snack.dimension(function(d){
    	return d["prompt_id_WhoYouSnackWith"]
    })
    
    var cost = snack.dimension(function(d){
    	return d["prompt_id_SnackCost"]
    })
    
    var period = snack.dimension(function(d){
    	return d["prompt_id_SnackPeriod"]
    })    
    
    var location = snack.dimension(function(d){
    	return d["prompt_id_SnackLocation"]
    })
    
    var healthy = snack.dimension(function(d){
    	return d["prompt_id_HealthyLevel"]
    })
    
	var day = snack.dimension(function(d) {
		var alldays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		//return d.date ? alldays[d.date.getDay()] : null;
		return d["date"] ? d["date"].getDay() : null;
    });     
    
    var lat = snack.dimension(function(d){
    	return d["latlng"] ? d["latlng"][0] : null;
    })
    
    var lng = snack.dimension(function(d){
    	return d["latlng"] ? d["latlng"][1] : null;
    })
    
    
    //save dashboard.dim
    dashboard.dim = {
        day: day,
        lat: lat,
        lng: lng,
    	date: date,
    	hour: hour,
    	area: area,
    	who: who,
    	cost: cost,
    	period: period,
    	location: location,
    	healthy : healthy
    };

    
	//crossfilter groups
    dashboard.groups = {
    	all: snack.groupAll(),
    	days : day.group(),
    	lats : lat.group(),
    	lngs : lng.group(),
    	dates : date.group(),
        hours : hour.group(Math.floor),
        areas : area.group(),
        whos : who.group(),
    	costs : cost.group(),
    	periods : period.group(),
    	locations: location.group(),
    	healthys : healthy.group(Math.floor)
    };   
    
    //show an error if there is no data
	if(dashboard.dim.date.top(1).length < 1){
		alert("Campaign '" + dashboard.campaign_urn + '" has no responses! Try again later (or press F5)')
	}	    
    
	//init gui stuff
    initcharts();
	
	//after map has been initiated
	$(".leaflet-control-zoom").append($("#buttonpanel"))	
	$("#loadinganimation").hide();
	$("#buttonpanel").show();
	$(".hoverinfo").css({left : ($(window).width() - $(".hoverinfo").width()) /2, right: "" });
	
	//$("#photobutton").trigger("click");	
	$("#timeseriesbutton").trigger("click");
	$("#piechartbutton").trigger("click");
	dc.renderAll();
	
	//if the url contains a image id, that will popup now
	if(oh.utils.state()[1]){
		//note: hash is converted to number
		var myhash = +oh.utils.state()[1]
		var alldata = dashboard.dim.date.top(9999);
		var allhashes = $.map(alldata, function(d){return d.hash});
		var i = $.inArray(myhash, allhashes);
		if(i > -1){
			//popup response
			dashboard.charts.modal.showmodal(alldata[i])			
		} else {
			//set hash to only campaign
			oh.utils.state(oh.utils.state()[0])
		}
	}
}
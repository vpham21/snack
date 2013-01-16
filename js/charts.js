function initcharts(){
	
	dc.constants.EVENT_DELAY = 5;
	dashboard.charts = dashboard.charts || {}
	
	var colorschema = [ "#8DD3C7", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#CCEBC5", "#FFED6F" ];
	
	// Date barchart
	var datechart = dc.barChart("#date-chart");
	var hourchart = dc.barChart("#hour-chart");	
	var costchart = dc.pieChart("#cost-chart");
	var periodchart = dc.pieChart("#period-chart");	
	var locationchart = dc.pieChart("#location-chart");	
	var whochart = dc.pieChart("#who-chart");	
	var healthychart = dc.barChart("#healthy-chart")
	
	//Dates barchart
	datechart
		.width(830-77) 
		.height(130) 
		.transitionDuration(200) 
		.margins({top: 10, right: 30, bottom: 20, left: 30})
		.dimension(dashboard.dim.date) 
		.group(dashboard.groups.dates) 
		.centerBar(false)
		.gap(1)
		.elasticY(true)
		.yAxisPadding(1)
		.x(d3.time.scale().domain([new Date(2012, 2, 23), new Date(2012, 5, 8)]).rangeRound([0, 10 * 77]))
		.round(d3.time.day.round)
		.xUnits(d3.time.days)
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
		
	//export renderlet
	dashboard.renderlet = datechart.renderlet

	//Hour barchart
	hourchart
		.width(295) // (optional) define chart width, :default = 200
		.height(130) // (optional) define chart height, :default = 200
		.transitionDuration(200) // (optional) define chart transition duration, :default = 500
		.margins({top: 10, right: 25, bottom: 20, left: 30})
		.dimension(dashboard.dim.hour) // set dimension
		.group(dashboard.groups.hours) // set group
		.elasticY(true)
		.centerBar(false)
		.gap(1)
		.round(dc.round.floor)
		.yAxisPadding(1)
		.x(d3.scale.linear().domain([0, 24]).rangeRound([0, 10*24]))
		.renderHorizontalGridLines(true)
		.renderVerticalGridLines(true)
	
	//Snack cost piechart
	costchart
		.width(180)
		.height(180)
		.radius(80)
		.colors(colorschema)
		.innerRadius(20)
		.label(function(d){
			switch(d.data.key){
			 case "Less than $1.00":
				return "< $1";
			 case "$1.00-$3.00":
				return "$1-$3";
			 case "$3.00-$5.00":
				return "$3-$5";
			 case "$5.00-$7.00":
				return "$5-7+"; 
			 case "$7.00-$10.00":
				return "$7-10";
			 case "More than $10.00":
				return "$10+";
			 default:
				return d.data.key
			}
		})	
		.dimension(dashboard.dim.cost)
		.group(dashboard.groups.costs)
	
	// Snack period piechart
	periodchart
		.width(180)
		.height(180)
		.radius(80)
		.colors(colorschema)
		.innerRadius(20)
		.label(function(d){
			switch(d.data.key){
			 case "Mid-morning":
				return "morning";
			 case "Late night":
				return "night";
			 case "Mid-afternoon":
				return "afternoon";
			 case "Evening":
				return "evening"; 
			 default:
				return d.data.key
			}
		})		
		.dimension(dashboard.dim.period)
		.group(dashboard.groups.periods)
	 
	// Snack location piechart	
	locationchart
		.width(180)
		.height(180)
		.radius(80)
		.colors(colorschema)
		.innerRadius(20)
		.dimension(dashboard.dim.location)
		.group(dashboard.groups.locations)		
	
	// Snack with who piechart	
	whochart
		.width(180)
		.height(180)
		.radius(80)
		.colors(colorschema)
		.innerRadius(20)
		.dimension(dashboard.dim.who)
		.group(dashboard.groups.whos) 
		
	// Snack healthy level barchart
	healthychart
		.width(30*6 + 30 + 30 + 6*3)
		.height(120)
		.yAxisPadding(1)
		.gap(3)
		.margins({top: 10, right: 30, bottom: 20, left: 30})
		.dimension(dashboard.dim.healthy) // set dimension
		.group(dashboard.groups.healthys)	
		.round(function(n) {return Math.floor(n)+0.5})
		.elasticY(true)
		.centerBar(true)
		.x(d3.scale.linear().domain([0, 6]).rangeRound([0, 30*6]))
		.renderHorizontalGridLines(true)
		//.xAxis().tickFormat(function(value){return d3.format("r")(value).substring(0,1)}).tickValues([1.5, 2.5, 3.5, 4.5, 5.5]);
		.xAxis().tickFormat(d3.format("d")).tickValues([1, 2, 3, 4, 5]);
	
	dc.dataCount("#data-count")
		.dimension(dashboard.snack) // set dimension to all data
		.group(dashboard.groups.all); 
	
	$("#data-count").show();
	
	//init map
	$('#map').filtermap();	
	
	//fix the radio buttons
	//$(".leaflet-control-layers-base").addClass("radio")

	//init modal
	dashboard.charts.modal = $("#responsemodal").responsemodal()
	
	//init thumbnail window
    dashboard.charts.photopanel = $("#photopanel").photopanel();

	//init wordclouds
	dashboard.charts.whychart = $("#why-chart").wordcloud({variable : "prompt_id_WhySnack"})
	dashboard.charts.whatchart = $("#what-chart").wordcloud({variable : "prompt_id_WhatSnack"})  
	
	$("#histpanel").draggable({containment: "body", snap: "body", snapMode: "inner" })
		
	//add reset handler
	$(".title a.reset").on("click", function(e){
		e.preventDefault();
		var chartid = $(this).attr("data-chart");
		eval(chartid).filterAll();
		dc.redrawAll();
		return false;
	});
	
	$("#buttonpanel button").on("dblclick", function(e){
		return false;
	});
	
	//initiate the buttons that hide/show charts	
	$(".widgetbutton").on("click", function buttonclick(){
		var panel = $(this).attr("data-panel");
		this.state = !this.state;
		if(this.state){
			//showing a panel
			if(panel == "photopanel") {
				dashboard.charts.photopanel.showme();
			}
			if(panel == "wcpanel") {
				dashboard.charts.whychart.refresh();
				dashboard.charts.whatchart.refresh();
				$(".wccontainer").css({ top: "", bottom: "", left: "", right: ""});
			}
			//any panel: reset position:
			$("#" + panel).css({ top: "", bottom: "", left: "", right: ""}).show();
		} else{
			//hiding a panel
			if(panel == "piepanel"){
				costchart.filterAll();
				periodchart.filterAll();
				locationchart.filterAll();
				whochart.filterAll();
				dc.redrawAll();
			}
			if(panel == "bottompanel"){
				datechart.filterAll();
				hourchart.filterAll();
				dc.redrawAll();				
			}
			if(panel == "histpanel"){
				healthychart.filterAll();
				dc.redrawAll();				
			}			
			$("#" + panel).hide();
		}
	});	
	
	inithelp();
}
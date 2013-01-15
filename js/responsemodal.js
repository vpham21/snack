(function( $ ) {
	$.fn.responsemodal = function(options){ 
		
		//note: we are not using $(this) right now, 
		//everything is hardcoded at this point

		var currentd;
	
		function showmodal(d){
			currentd = d;		
			$("#responsemodal .modal-header h3").text(d["prompt_id_WhatSnack"].substring(0, 30))
			$("#tablewhat").text(d["prompt_id_WhatSnack"])
			$("#tablewhy").text(d["prompt_id_WhySnack"])
			$("#tablewhen").text(d["prompt_id_SnackPeriod"])
			$("#tablewho").text(d["prompt_id_WhoYouSnackWith"])
			$("#tablewhere").text(d["prompt_id_SnackLocation"])
			$("#tablecost").text(d["prompt_id_SnackCost"])
			$("#tablehealthy").text(d["prompt_id_HealthyLevel"])
			$("#resphoto").attr("src", oh.getimageurl(d));
			$("#responsemodal").modal();
			oh.utils.state(dashboard.campaign_urn, d["hash"]);
		}
		
		function showfirst(){
			showmodal(dashboard.dim.date.top(1)[0]);		
		}		
		
		function shownext(){
			if(!currentd) {
				showfirst();
			} else {
				var alldata = dashboard.dim.date.top(9999) 
				var index = $.inArray(currentd, alldata)
				if(index < 0 || index == (alldata.length-1)) {
					//show first record
					return showmodal(alldata[0]);
				}
				//show next record
				showmodal(alldata[index+1]);			
			}
		}
		
		function showprev(){
			if(!currentd) {
				showfirst();
			} else {
				var alldata = dashboard.dim.date.top(9999) 
				var index = $.inArray(currentd, alldata)
				if(index < 0 || index == 0) {
					//show last record
					return showmodal(alldata[alldata.length-1]);
				}
				//show next previous record
				showmodal(alldata[index-1]);			
			}
		}
	
		
		$("#previtem").on("click", function(){showprev(); return false})
		$("#nextitem").on("click", function(){shownext(); return false})
		$("#responsemodal").on("hide", function(){
			oh.utils.state(dashboard.campaign_urn);
		})
		$("img#resphoto").on("error", function(){$(this).attr("src", "images/nophoto.jpg")});
		
		//export methods
		return {
			showmodal : showmodal,
			shownext : shownext,
			showprev : showprev
		};
	}
})( jQuery );
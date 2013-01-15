(function( $ ) {
	$.fn.photopanel = function(options) {
		var pages;
		var pagesize = 20;
		var currentpage = 0;		
		var photodelay = oh.utils.delayexec();	

		var panel = $(this)
			.draggable({containment: "body", snap: "body", snapMode: "inner" })		
			.addClass("well");

		function prevthumbs(){
			var pagecount = pages.length;
			currentpage = (pagecount + currentpage - 1) % pagecount;
			updatepictures();	
			return false;
		}
		

		function nextthumbs(){
			var pagecount = pages.length;
			currentpage = (pagecount + currentpage + 1) % pagecount;
			updatepictures();
			return false;
		}
		
		function fixanchors(){
			currentpage == 0 ? $("#prevthumbs").hide() : $("#prevthumbs").show();
			currentpage == pages.length -1 ? $("#nextthumbs").hide() : $("#nextthumbs").show();
		}
		
		function updatepictures(){
			dashboard.message("updating thumbnails.")	
			
			var newlist = $("<ul>", {class: "thumbnails"})
			var thispage = pages[currentpage];			
	 		for(var i = 0; i < thispage.length; i++) {
	 			//skip records with no images
	 			var d = thispage[i];
 				var li = $("<li>", {class : "span2"}).appendTo(newlist);
 				var a = $("<a>", {class: "thumbnail", href : "#" }).appendTo(li);
 				var img = $('<img>', {
 					alt: d["prompt_id_WhatSnack"],
 					class : "img-rounded",
	 					src : getthumburl(d)
	 			})
	 			img.appendTo(a);
	 			a.on("click", (function(){
	 				var k = d;
	 				return function(){dashboard.charts.modal.showmodal(k); return false;}
	 			})());
	 			img.on("error", imgerror);
	 		}
	 	
	 		function displaythumblist(){
				newlist.appendTo("#imagelist");
				$("#imagelist").fadeIn(300);	
				fixanchors();				
	 		}
	 		
	 		function imgerror(){
	 			$(this).attr("src", "images/photothumb.jpg")
	 		}
		 	
			if(!($("#imagelist").is(":empty"))){
				$("#imagelist").fadeOut(500, function(){
					$("#imagelist").empty();					
					displaythumblist();		
				});
			} else {
				displaythumblist();				
			}	 	

		 	//add error handler
	 	
		}
		
		function updatepages(){
			pages = [];
			currentpage = 0;
			var alldata = oh.utils.getRandomSubarray(dashboard.dim.date.top(9999));
			for(var i = 0; i < alldata.length; i++){
				var x = Math.floor(i/pagesize);
				var y = i % pagesize;
				pages[x] = pages[x] || [];
				pages[x][y] = alldata[i];
			}	
			updatepictures();
		}
		
		function getthumburl(record){
			//check for missing images
			if(record["prompt_id_SnackImage"] == "" || record["prompt_id_SnackImage"] == "SKIPPED" || record["prompt_id_SnackImage"] == "NOT_DISPLAYED"){
				return "images/photothumb.jpg";
			}
			if(dashboard.campaign_urn == "demo"){
				return "data/demo/thumbs/" + record["prompt_id_SnackImage"] + ".jpg";
			} else {
	 			return "/app/image/read?client=dashboard&size=icon&id=" + record["prompt_id_SnackImage"];
			}
		}		
		
		function refresh(){
    		photodelay(function(){
    			updatepages();
    		}, 500);
		}
		
		//
		$("#prevthumbs").on("click", prevthumbs)
		$("#nextthumbs").on("click", nextthumbs)
		
		//register renderlet
		dashboard.renderlet(function(){
	    	if(panel.is(":visible")){
				$("#imagelist").fadeOut(150, function(){
					$("#imagelist").empty();						
				});	    		
	    		refresh();
	    	}
		});
		
		panel.showme = function(){
			$("#imagelist").empty();			
			refresh();
		}
		return panel;
	}
})( jQuery );	






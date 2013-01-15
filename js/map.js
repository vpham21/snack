(function( $ ) {
	$.fn.filtermap = function(options) {
		
		var filterdelay = oh.utils.delayexec();
		var redrawdelay = oh.utils.delayexec();
		var markerdelay = oh.utils.delayexec();
		var markerblocker; 
		
		//this static variable controls if filters are activated when hovering over an neighborhood.
		var filterOnHover = false;
		
		querystate = {
			
			hovered : null,
			selected : null,
				
			reset : function(){
				//should not happen, but just in case.
				if(this.hovered){
					this.hover(this.hovered);
				}
				
				//reset
				if(this.selected){
					this.select(this.selected);
				} else {
					this.runFilter();
				}			
			},
			hover : function(neighborhood){
				this.hovered = neighborhood.hover ? neighborhood : null;
				if(filterOnHover){
					this.runFilter()
				} else {
					neighborhoods.colormap()					
				}
			},
			select : function(neighborhood){
				//unselect previously selected
				if(this.selected){
					this.selected.selected = false;
					this.selected = null;
					this.hovered = null;
				};
				
				//switch clicked state:
				if(neighborhood.selected){
					this.selected = neighborhood;
					this.runFilter();
				} else {
					this.runFilter();
				}
			},
			runFilter : function(){		
				if(this.selected){
					//if we are hovering, that one will be used for filtering				
					dashboard.dim.area.filter(this.selected.feature.properties.name);
					dc.redrawAll();
				} else if(this.hovered) {
					//to enable hover filtering:
					dashboard.dim.area.filter(this.hovered.feature.properties.name);
					dc.redrawAll();
				} else {
					dashboard.dim.area.filterAll();
					dc.redrawAll();
				}
			}
		};
		

		
		//background tiles
		var cloudmade1 = new L.TileLayer(
			'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/1/256/{z}/{x}/{y}.png', {
				attribution : false,
				maxZoom : 18
			}
		);
		
		var cloudmade2 = new L.TileLayer(
			'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
				attribution : false,
				maxZoom : 18
			}
		);	
		
		var cloudmade3 = new L.TileLayer(
			'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/22677/256/{z}/{x}/{y}.png', {
				attribution : false,
				maxZoom : 18
			}
		);	
		
		var cloudmade4 = new L.TileLayer(
			"http://{s}.latimes.com.s3.amazonaws.com/quiet-la-0.2.3/{z}/{x}/{y}.png", {
				attribution : false,
				maxZoom : 18,
				subdomains: [
				 'tiles1',
				 'tiles2',
				 'tiles3',
				 'tiles4'
				]
			}
		);	
				
		
		
		//initiate the map
		var mymap = new L.Map(this.attr("id"), {
			center: [34.0522222, -118.2427778],
			zoom: 9,
			layers: cloudmade3
		});
		
		//hack for the overly sensitive dragger
		mymap.on("dragstart", function(){
			if(!querystate.hovered) return;
			var s = mymap.getCenter()
			var handler = function(){
				var delta = s.distanceTo(mymap.getCenter());
				var total = mymap.getBounds().getSouthWest().distanceTo(mymap.getBounds().getNorthEast());
				var drag = Math.abs(delta / total) * 100
				if(drag < 0.5) {
					querystate.hovered.selected = !querystate.hovered.selected;
					querystate.select(querystate.hovered);
				}
				this.removeEventListener("dragend", handler);
			};
			this.on("dragend", handler);
		});	
		

		//helper function to generate layers from geojson data
		var LAData = function(jsondata){
			
			//a table with all the neighbordhoods for this layer
			var allhoods = {};				

			//create geojson layer
			var datalayer = new L.GeoJSON(jsondata, {
				style: function(feature){
					return(
						{
							
							"color" : "#999",
							"weight" : 1.5,
							"opacity" : 0.5,
							"fillColor" : "#F0F0FF",
							"fillOpacity" : 0.8
						}
					);				
				},
				onEachFeature: function(feature, layer) {
					
					//neighborhood object
					var neighborhood = {feature:feature, layer:layer, count:0, selected:false, hover:false};
					allhoods[feature.properties.name] = neighborhood;
					
					//click event
					layer.on("click", function(e) {
						//select or unselect
						neighborhood.selected = !neighborhood.selected;
						querystate.select(neighborhood);
					});	
					
					//mouse-in event
					layer.on("mouseover", function(e) {
						info.update(feature.properties);
						neighborhood.hover = true;
						querystate.hover(neighborhood);
					});
					
					//mouse-out event
					layer.on("mouseout", function(e) {
						info.update();
						neighborhood.hover = false;
						querystate.hover(neighborhood);
						
					});					
					
				}
			});
			
			//update polygon colors
			var colormap = function(){
				//if(!mymap.hasLayer(LAData)) return;
				dashboard.message("updating neighborhood colors")
				updateCounters();
				for(name in allhoods){
					if(allhoods[name].selected){
						//selected or hover polygons				
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "#00477F"});
					} else if(allhoods[name].hover){ 
						//hover color
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "steelblue"});
					} else if(allhoods[name].count > 0){
						//polygons with data
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 1, "fillColor": "#CCCCCC"});
					} else {
						//inactive polygons
						allhoods[name].layer.setStyle({color: "#999", "fillOpacity" : 0.8, "fillColor": "#F0F0FF"});
					};
				};			
			}
			
			//recalculate counts
			var updateCounters = function(){
				//reset counters
				for(name in allhoods){
					allhoods[name].count = 0;
				};	
				
				//new counter
				var areacounts = dashboard.groups.areas.all();
				for(var i = 0; i < areacounts.length; i++){
					var name = areacounts[i].key;
					if(name == "") continue;
					allhoods[name].count = areacounts[i].value;
				};
			}		
			
			datalayer.colormap = colormap;

			return(datalayer);
		}
		
		

		
		//grouped markers layer
		var snackmarkers = new L.MarkerClusterGroup({ 
			//spiderfyOnMaxZoom: true, 
			//showCoverageOnHover: false, 
			//zoomToBoundsOnClick: false 
		});
		
		var renderMarkers = function(n){
			dashboard.message("updating markers.")
			//clear current layers
			snackmarkers.clearLayers();
			if(!mymap.hasLayer(snackmarkers)) return;
			mymap.removeLayer(snackmarkers);
			
			//get new data
			var markerdata = dashboard.dim.date.top(n);
			for (var i = 0; i < markerdata.length; i++) {
				var a = markerdata[i];
				if(!a["latlng"]){
					//console.log("skipping record with no lat/lng")
					continue;
				}
				var marker = new L.Marker(new L.LatLng(a["latlng"][0], a["latlng"][1]), { title: "Test" });
				snackmarkers.addLayer(marker);
				marker.on("click", (function(){
					var k = a;
					return function(){dashboard.charts.modal.showmodal(k)};
				})());
			}
			
			//add to map
			mymap.addLayer(snackmarkers);
			//snackmarkers.clearLayers();
		}
		
		//this function sets a filter on the current viewport
		//or removes the filter if the marker layer is gone
		var geofilter = function(){
			if(!mymap.hasLayer(snackmarkers)) {
				dashboard.dim.lat.filter(null);
				dashboard.dim.lng.filter(null);
				//return;
			} else {
				var bounds = mymap.getBounds();
				var lat = [bounds.getNorthEast()["lat"], bounds.getSouthWest()["lat"]];
				var lng = [bounds.getNorthEast()["lng"], bounds.getSouthWest()["lng"]];
				
				//flip around if needed
				lat = lat[0] < lat[1] ? lat : [ lat[1] , lat[0] ];
				lng = lng[0] < lng[1] ? lng : [ lng[1] , lng[0] ];
				
				//filter
				dashboard.dim.lat.filter(lat);
				dashboard.dim.lng.filter(lng);
			}
		}	
		
		//filter by viewport
		mymap.on("moveend", function(){
			if(mymap.hasLayer(snackmarkers)){
				geofilter();
				//this is a hack to prevent the renderlet from calling twice.
				markerblocker = true;
				redrawdelay('dc.redrawAll()', 200);
			}
		});	
		
		//create the layers with LA areas and add to map
		neighborhoods = LAData(la_county);

		//add the area layer selector thingies		
		var interactlayers = {
			"Markers" : snackmarkers,
			"Neighbordhoods" : neighborhoods,
			"Disable" : L.marker([0,0])
		}
		
		var cloudmaps = {
			"Standard" : cloudmade1, 
			"Roads" : cloudmade2,
			"Grayish" : cloudmade3,
			"Quiet" : cloudmade4,
			"Disable" : L.marker([0,0])
		}
		
		var mapcontrol = new L.Control.Layers(cloudmaps,{}).setPosition("bottomright");	
		mymap.addControl(mapcontrol);	
		
		var layercontrol = new L.Control.Layers(interactlayers,{}).setPosition("topright");	 
		mymap.addControl(layercontrol);			

		//add the state hover custom box
		var info = L.control();

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'hoverinfo'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};
		
		// method that we will use to update the control based on feature properties passed
		info.update = function (props) {
			if(props){
			    this._div.innerHTML = '<h4>Neighborhood</h4>' +  '<b>' + props.name + '</b>';
			    $(this._div).show();				
			} else {
				$(this._div).hide()
			}
		};

		info.addTo(mymap);		
		
		function domarkers(){
			dashboard.dim.lat.filter(null);
			dashboard.dim.lng.filter(null);  			
			renderMarkers(10000);
			geofilter();
		}
		
		//register renderlet update
		dashboard.renderlet(function(){
			if(mymap.hasLayer(neighborhoods)){
				neighborhoods.colormap()
	    	} 
	    	if(mymap.hasLayer(snackmarkers)){
	    		if(markerblocker) {
	    			//don't re-render markers (in case of zoom)
	    			markerblocker = false;
	    		}  else { 
	    			snackmarkers.clearLayers();
	    			markerdelay(domarkers, 100)
	    		}
	    	}
		});				
		
		//hack to render when switching between neighborhoods and markers layer.
		$(".leaflet-top .leaflet-control-layers-base input").on("click", function(){
			geofilter();
			querystate.reset();
		});		
		
		mymap.attributionControl.setPrefix(false).addAttribution('Design by <a href="http://jeroenooms.github.com">Jeroen Ooms</a>');
		
		//chain it
		return mymap;
	}
})( jQuery );
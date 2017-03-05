queue()
    .defer(d3.json, "/apd/icu")
    // .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson) {
	
	//Clean projectsJson data
	var icuProjects = projectsJson;
	console.log('icuProjects is:  >>>>>> ',projectsJson);

	// var dateFormat = d3.time.format("%Y%m");
	var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S.%L")
	icuProjects.forEach(function(d) {
		// console.log('input date: ', d["hosp_ad_dtm"]);
		d["icu_ds_dtm"] = dateFormat.parse(d["icu_ds_dtm"]);
		// console.log('parse date: ', d["hosp_ad_dtm"]);
		d["icu_ds_dtm"].setDate(1);
		// d["total_icu"] = +d["total_icu"];

		// console.log('check this out of date: ', d["total_icu"]);
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(icuProjects);

	console.log('ndx is:  >>>>>> ',ndx);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["icu_ds_dtm"]; });

	console.log(dateDim)

	var hospitalClassDim = ndx.dimension(function(d) { return d["hospitalclassification"]; });
	var hopsrcDim = ndx.dimension(function(d) { return d["hosp_srce"]; });
	var hopotcDim = ndx.dimension(function(d) { return d["hosp_outcm"]; });

	var ageDim = ndx.dimension(function(d) { return d["age"]; });
	var sexDim = ndx.dimension(function(d) { return d["sex"]; });
	
	var icuhrsDim = ndx.dimension(function(d) { return d["icu_hrs"]; });
	var icusrcDim = ndx.dimension(function(d) { return d["icu_srce"]; });
	var icuotcDim = ndx.dimension(function(d) { return d["icu_outcm"]; });

	var diedDim = ndx.dimension(function(d) { return d["died_icu"]; });


	//Calculate metrics
	var numProjectsByDate = dateDim.group(); 
	var numProjectsByHopClass = hospitalClassDim.group();
	var numProjectsByHopSrc = hopsrcDim.group();
	var numProjectsByHopOut = hopotcDim.group(); 

	var numProjectsByAge = ageDim.group();
	var numProjectsBySex = sexDim.group();

	var numProjectsByIcuHrs = icuhrsDim.group(); 
	var numProjectsByIcuSrc = icusrcDim.group();
	var numProjectsByIcuOut = icuotcDim.group();

	var numProjectsByDie = diedDim.group();

	// var totalDonationsByState = stateDim.group().reduceSum(function(d) {
	// 	return d["total_donations"];
	// });

	var all = ndx.groupAll();
	// var totalDonations = ndx.groupAll().reduceSum(function(d) {return d["total_donations"];});

	// var max_state = totalDonationsByState.top(1)[0].value;

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["icu_ds_dtm"];
	var maxDate = dateDim.top(1)[0]["icu_ds_dtm"];

	console.log(minDate);
	console.log(maxDate);

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#hospital-type-row-chart");
	var icuSrcChart = dc.rowChart("#icu-src-type-row-chart");
	var icuOutChart = dc.rowChart("#icu-out-level-row-chart");
	// var numberProjectsND = dc.numberDisplay("#number-projects-nd");
	// var totalDonationsND = dc.numberDisplay("#total-donations-nd");

	// numberProjectsND
	// 	.formatNumber(d3.format("d"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(all);

	// totalDonationsND
	// 	.formatNumber(d3.format("d"))
	// 	.valueAccessor(function(d){return d; })
	// 	.group(totalDonations)
	// 	.formatNumber(d3.format(".3s"));

	timeChart
		.width(600)
		.height(250)
		.margins({top: 10, right: 50, bottom: 30, left: 50})
		.dimension(dateDim)
		.group(numProjectsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.xAxisLabel("Year")
		.yAxis().ticks(4);

	resourceTypeChart
        .width(600)
        .height(250)
        .dimension(hospitalClassDim)
        .group(numProjectsByHopClass)
        .xAxis().ticks(4);

	icuSrcChart
		.width(300)
		.height(250)
        .dimension(icusrcDim)
        .group(numProjectsByIcuSrc)
        .xAxis().ticks(6);


	icuOutChart
		.width(300)
		.height(250)
        .dimension(icuotcDim)
        .group(numProjectsByIcuOut)
        .xAxis().ticks(6);


	// usChart.width(1000)
	// 	.height(330)
	// 	.dimension(stateDim)
	// 	.group(totalDonationsByState)
	// 	.colors(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"])
	// 	.colorDomain([0, max_state])
	// 	.overlayGeoJson(statesJson["features"], "state", function (d) {
	// 		return d.properties.name;
	// 	})
	// 	.projection(d3.geo.albersUsa()
 //    				.scale(600)
 //    				.translate([340, 150]))
	// 	.title(function (p) {
	// 		return "State: " + p["key"]
	// 				+ "\n"
	// 				+ "Total Donations: " + Math.round(p["value"]) + " $";
	// 	})

    dc.renderAll();

};
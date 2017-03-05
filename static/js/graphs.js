queue()
    .defer(d3.json, "/apd/icu")
    // .defer(d3.json, "static/geojson/us-states.json")
    .await(makeGraphs);

function makeGraphs(error, projectsJson) {
	
	//Clean projectsJson data
	var icuProjects = projectsJson;
	var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S.%L")
	icuProjects.forEach(function(d) {
		d["icu_ds_dtm"] = dateFormat.parse(d["icu_ds_dtm"]);
		d["icu_ds_dtm"].setDate(1);
		
		if (d["icu_srce"] == 1) {
			d["icu_srce"] = "OT/Recovery";
		} else if  (d["icu_srce"] == 2) {
			d["icu_srce"] = "Accident & Emergency"
		} else if (d["icu_srce"] == 3) {
			d["icu_srce"] = "Ward"
		} else if (d["icu_srce"] == 4) {
			d["icu_srce"] = "Other ICU, same hosptial"
		} else if (d["icu_srce"] == 5) {
			d["icu_srce"] = "Other hosptial"
		} else {
			d["icu_srce"] = "Other hosptial ICU 9 Direct ICU admssion"
		};


		if (d["icu_outcm"] == 2) {
			d["icu_outcm"] = "Died in ICU";
		} else if  (d["icu_outcm"] == 3) {
			d["icu_outcm"] = "Survived ICU"
		} else if (d["icu_outcm"] == 5) {
			d["icu_outcm"] = "Transferred to another ICU"
		} else if (d["icu_outcm"] == 6) {
			d["icu_outcm"] = "Transferred to another hospital"
		} else {
			d["icu_outcm"] = "Other"
		};

		if (d["died_icu"] == 1) {
			d["died_icu"] = "Died"
		} else {
			d["died_icu"] = "Survival"
		}

	});

	//Create a Crossfilter instance
	var ndx = crossfilter(icuProjects);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["icu_ds_dtm"]; });

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

	var all = ndx.groupAll();

	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["icu_ds_dtm"];
	var maxDate = dateDim.top(1)[0]["icu_ds_dtm"];

    //Charts
	var timeChart = dc.barChart("#time-chart");
	var resourceTypeChart = dc.rowChart("#hospital-type-row-chart");
	var icuSrcChart = dc.rowChart("#icu-src-type-row-chart");
	var icuOutChart = dc.rowChart("#icu-out-level-row-chart");

	var avghrsND = dc.numberDisplay("#icu-hrs-projects-nd");
	var avgageND = dc.numberDisplay("#age-avg-projects-nd");

	// var maxageND = dc.numberDisplay("#age-max-projects-nd");

	var genderRingChart = dc.pieChart("#gender-chart");
	var surviveRingChart = dc.pieChart('#survive-chart');

	var numGenderPie = ndx.groupAll().reduceSum(function(d) {return d["sex"];});
	var numSurvivPie = ndx.groupAll().reduceSum(function(d) {return d["died_icu"];});

	// var totalhorsICU = ndx.groupAll().reduceSum(function(d) {return d["icu_hrs"];});
	var maxage = ndx.groupAll().reduceSum(function(d) {return d.top(1)[0]["age"];});

	var average = function(d) {return d.n ? d.tot/d.n : 0;};
	var meanHrGroup = ndx.groupAll().reduce(
          function (p, v) {
              ++p.n;
              p.tot += v["icu_hrs"];
              return p;
          },
          function (p, v) {
              --p.n;
              p.tot -= v["icu_hrs"];
              return p;
          },
          function () { return {n:0,tot:0}; }
      );


	var meanAgeGroup = ndx.groupAll().reduce(
          function (p, v) {
              ++p.n;
              p.tot += v["age"];
              return p;
          },
          function (p, v) {
              --p.n;
              p.tot -= v["age"];
              return p;
          },
          function () { return {n:0,tot:0}; }
      );

  	var expCount = function(d) {
    	  return d.n;
  	};


  	// maxageND
  	//   	.group(maxage)
  	// 	.valueAccessor(function(d){return d;})
  	// 	.formatNumber(d3.format(".3g"));

  	avghrsND
  		.group(meanHrGroup)
  		.valueAccessor(average)
  		.formatNumber(d3.format(".3g"));


  	avgageND
  		.group(meanAgeGroup)
  		.valueAccessor(average)
  		.formatNumber(d3.format(".3g"));
		
    genderRingChart
		.height(250)
		.width(200)
		.radius(90)
		.innerRadius(40)
		.transitionDuration(1000)
		.dimension(numGenderPie)
		.group(numProjectsBySex);


	surviveRingChart
		.height(250)
		.width(200)
		.radius(90)
		.innerRadius(40)
		.transitionDuration(1000)
		.dimension(numSurvivPie)
		.group(numProjectsByDie);

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

    dc.renderAll();

};
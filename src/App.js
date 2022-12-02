import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from "react-native";
import * as d3 from 'd3';
import NumericInput from 'react-numeric-input';


const styles = StyleSheet.create({
  container: {
    flex: .5,
    marginLeft: 20,
    marginTop: 20,
    gap: '4rem',
    flexDirection: "row",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: "sans-serif"
  },
  subTitle: {
    fontSize: 22,
    fontFamily: "sans-serif"
  },
  square: {
    backgroundColor: "#7cb48f",
    width: 100,
    height: 100,
    margin: 4,
  },

});


function App(){
    const width = 960;
    const height = 500;
    const outputHeight = height/2
    const outputDims = {width: 400, height: height/2}
    const padding = 20;
    const verticalPadding = 50;
    const legendSpacing = 200;
    const image_size = {width: 540, height: 360};
    const y_limits = {min: verticalPadding + 48, max: verticalPadding + 308}; // limits for circle, hardcoded for now
    const x_limits = {min: padding + 68, max: padding + 480}; // limits for circle, hardcoded for now
    const xScaleField = d3.scaleLinear().range([0, 100]).domain([x_limits.min, x_limits.max]);
    const yScaleField = d3.scaleLinear().range([0, 100]).domain([y_limits.min, y_limits.max]);
    let svgRef = useRef();
    const radius = 15;
    const xScaleOut = d3.scaleLinear().domain([0.0, 5.0]).range([2*padding, outputDims.width]);
    const yScaleOut = d3.scaleBand().range([padding, outputHeight])
    .domain(["For", "Against"]).padding(.5);
    const legend_data = [{label: "Mean pass location", x: padding, y:(verticalPadding), color: "blue"}, 
                        {label: "Mean tackle location", x: padding+legendSpacing, y:(verticalPadding), color: "red"}]


    const [passLoc, setPassLoc] = useState({x:295, y:235}); // arbitrary starting location
    const [challengeLoc, setChallengeLoc] = useState({x: 295, y:165}); // arbitrary starting location
    const [tackleAccuracy, setTackleAccuracy] = useState(.5);
    const [passAccuracy, setPassAccuracy] = useState(.5);
    const [shotAccuracy, setShotAccuracy] = useState(.5);

    const [predictedGoals, setPredictedGoals] = useState({for: 2.0, against: 2.0});
    const [lrCoeffPA, setLRCoeffPA] = useState([-3.936042094784388,
      -0.8963569375638264,
      -0.5273268864236662,
      0.02280314311543698,
      -0.0026965715310248548,
      -0.07493065865757,
      -0.00295501555047048]);
    const [lrBiasPA, setLRBiasPA] = useState(7.582963144685651);
    const [lrCoeffPF, setLRCoeffPF] = useState([3.038506285021811,
      5.542064844907213,
      3.421727418439658,
      0.013844574698440918,
      -0.005099436608936334,
      -0.006649412569718784,
      -0.010050751346034606]);
    const [lrBiasPF, setLRBiasPF] = useState(-5.799153755524648);
    const saturate = (location, min, max) => {
      if(location >= max){
        return max;
      }
      else if(location <= min){
        return min;
      }
      return location;
    }

    function computeOutput(x, coeff, bias){
      let outVal = 0;
      x.forEach((feature, index)=>{
        outVal += feature*coeff[index];
      });
      outVal += bias;
      return outVal;
    }

    function parseData(dataIn, setFunction) {
      let outVal = [];
      dataIn.forEach(element => {
        let appendVal = [];
        Object.keys(element).forEach(function(key,index){
          if(key!==""){
            outVal.push(+element[key]);
          }
        }) 
          //outVal.push(appendVal);
        })
        console.log(outVal);
        setFunction(outVal);
      }

    // feature definition
    // ["duel_accuracy", "pass_accuracy", "shot_accuracy", "mean_x_duel", "mean_y_duel", "mean_x_pass", "mean_y_pass"].

    // load weights
    // useEffect(()=>{
    //   d3.dsv(',',lr_PA_weights).then(data => {console.log(data);
    //     parseData(data, setLRCoeffPA);});
    //   d3.dsv(',',lr_PA_intercept).then(data => {
    //       parseData(data, setLRBiasPA);});
    //   d3.dsv(',',lr_PF_weights).then(data => {
    //       parseData(data, setLRCoeffPF);});
    //   d3.dsv(',',lr_PF_intercept).then(data => {
    //       parseData(data, setLRBiasPF);})
    // },[])

    // runs on inital render
    useEffect(()=>{
      // main g elements
      d3.select('#main_svg').append("g").attr("id", "circle_g").attr("transform", "translate(" + padding + "," + verticalPadding + ")");
      d3.select('#main_svg').append("g").attr("id", "image_g").attr("transform", "translate(" + padding + "," + verticalPadding + ")");
      d3.select("#main_svg").append("g").attr("id", "output_display_g").attr("transform", "translate(" + (2*padding + image_size.width) +"," + (verticalPadding+padding) + ")");
      d3.select("#main_svg").append("g").attr("id", "legend_display_g").attr("transform", "translate(" + padding +"," + (padding+ verticalPadding + image_size.height) + ")");
      d3.select("#title_display").attr("transform", "translate("+width/2+","+padding+")");
      d3.select("#legend_title").attr("transform", "translate("+padding+","+(verticalPadding+ 2*padding+ image_size.height)+")")
      
      // output display
      d3.select("#output_display_g").append("text").text("Predicted Goals").attr("font-size", "20").attr("transform", "translate(" + (outputDims.width/2) +"," + 0 + ")");
      d3.select('#output_display_g').append("g").attr("id", "output_x_axis")
      .attr("transform", "translate(" + 0 + "," + (outputHeight) + ")")
      .call(d3.axisBottom(xScaleOut)).selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");
      d3.select("#output_display_g").append("g").attr("id", "output_y_axis").attr("transform", "translate(" + (2*padding) + "," + 0 + ")")
      .call(d3.axisLeft(yScaleOut));
      
      // legend circles and text
      d3.select("#legend_display_g").selectAll(".legend_circle").data(legend_data).enter().append("circle").attr("class", "legend_circle")
      .attr("cx", function (d) {return d.x}).attr("cy", function (d) {return d.y}).attr("r", radius).style("fill", function (d) {return d.color})
      d3.select("#legend_display_g").selectAll("text").data(legend_data).enter().append("text")
      .attr("x", function (d) {return d.x + radius + 5}).attr("y", function (d) {return d.y + radius/2}).text(function (d) {return d.label});

      d3.select("#main_svg").append("g").attr("id", "instructions_text").attr("transform", "translate("+(2*padding + image_size.width)+", "+(padding+ verticalPadding + image_size.height)+")")
      .append("text").attr("dy", "0em").text("Drag a spacial feature or update the numeric inputs")
      d3.select("#instructions_text").append("text").attr("dy", "1em").text("to predict the goal outputs. Your goal is on the left");
      d3.select("#instructions_text").append("text").attr("dy", "2em").text("and your opponent's is on the right.");
    },[])

    // runs every render
    useEffect(()=>{
      d3.select('#image_g').selectAll("image").data([{x:0, y:0}])
      .enter()
      .append("image")
      .attr("id", "field_image")
      .attr('x', (d)=>{return d.x})
      .attr('y', (d)=>{return d.x})
      .attr('width', image_size.width)
      .attr('height', image_size.height)
      .attr("xlink:href", "/assets/images/field_top_view.png")

      d3.select('#main_svg').selectAll(".main_circle").data([{color: "blue", ...passLoc}, {color: "red", ...challengeLoc}]).enter().append("circle")
      .attr("cx", function (d) {return d.x})
      .attr("cy", function (d) {return d.y})
      .attr("r", radius)
      .attr("class", "main_circle")
      .style("fill", function (d) {return d.color})
          .on("mouseover", function (d) {d3.select(this).style("cursor", "move");})
          .on("mouseout", function (d) {})
          .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
                );
    
    })

    useEffect(()=>{
      console.log(predictedGoals);
      const dataIn = [{label: "For", val: predictedGoals.for}, {label: "Against", val:predictedGoals.against}];
      d3.select("#output_display_g").selectAll("rect").data([]).exit().remove();
      d3.select("#output_display_g").selectAll("rect").data(dataIn)
      .enter().append("rect").attr("x", xScaleOut(0)).attr("y", function(d){return yScaleOut(d.label)})
      .attr("width", function (d) {console.log("barchart data in", d); return xScaleOut(d.val)}).attr("height", yScaleOut.bandwidth()).attr("fill", "#69b3a2")
    },[predictedGoals])

    // update the outputs
    // feature definition
    // ["duel_accuracy", "pass_accuracy", "shot_accuracy", "mean_x_duel", "mean_y_duel", "mean_x_pass", "mean_y_pass"].
    
    useEffect(()=>{
      if(lrCoeffPA == null){
        console.log("found null")
        return;
      }
      const inputVal = [tackleAccuracy, passAccuracy, shotAccuracy, 
        xScaleField(challengeLoc.x), yScaleField(challengeLoc.y),
                          xScaleField(passLoc.x), yScaleField(passLoc.y)];
      const pointsAgainst = computeOutput(inputVal, lrCoeffPA, lrBiasPA);
      const pointsFor = computeOutput(inputVal, lrCoeffPF, lrBiasPF);
      setPredictedGoals({for: pointsFor, against: pointsAgainst})
      const testInput = [.5, .5, .5, 50.0, 50.0, 50.0, 50.0]
      console.log("Nominal points against", computeOutput(testInput, lrCoeffPA, lrBiasPA))
    },[tackleAccuracy, passAccuracy, shotAccuracy, challengeLoc, passLoc]);
    
    function dragstarted() {
        d3.select(this).attr("stroke", "black");
      }  
      function dragged(event, d) {
        d3.select(this).attr("cx", d.x = saturate(event.x, x_limits.min, x_limits.max))
        .attr("cy", d.y = saturate(event.y, y_limits.min, y_limits.max));
      }
    
      function dragended(event, d) {
        const newVal = {x: saturate(event.x, x_limits.min, x_limits.max), y: saturate(event.y, y_limits.min, y_limits.max)};
        event.subject.color === "blue" ? setPassLoc(()=>newVal) : setChallengeLoc(()=>newVal);
        d3.select(this).attr("stroke", null);
      }

    // DEBUGGING LOGGING
    // useEffect(()=>{
    //   console.log("Pass location updated: ")
    //   console.log("X: ", xScaleField(passLoc.x));
    //   console.log("Y: ", yScaleField(passLoc.y));
    // }, [passLoc])

    // useEffect(()=>{
    //   console.log("Tackle location updated: ")
    //   console.log("X: ", xScaleField(challengeLoc.x));
    //   console.log("Y: ", yScaleField(challengeLoc.y));
    // }, [passLoc])

    // useEffect(()=>{
    //   console.log("Challenge location updated: ", challengeLoc)
    // }, [challengeLoc])

    // useEffect(()=>{
    //   console.log("feature5 updated: ", feature5)
    // },[feature5])

    // useEffect(()=>{
    //   console.log("feature6 update: ", feature6)
    // },[feature6])

  return(
  <div className="App">
    <div>
      <svg id="main_svg" width={960} height={500} ref={svgRef}>
        <text id="title_display" style={styles.title}>
          Soccer Data Visualization
        </text>
        <text id="legend_title" style={styles.subTitle}>
          Feature Definitions
        </text>

      </svg>
      </div>
    <div>
      <View style={styles.container}>
      <div>
      <NumericInput min={0.0} max={1} step={.1} width={30} value={tackleAccuracy} onChange={setTackleAccuracy}/>
      <text> Tackle Accuracy</text>
      </div>
      <div>
      <NumericInput min={0.0} max={1} step={.1} value={passAccuracy} onChange={setPassAccuracy}/>
      <text> Pass Accuracy</text>
      </div>
      <div>
      <NumericInput min={0.0} max={1} step={.1} value={shotAccuracy} onChange={setShotAccuracy}/>
      <text> Shot Accuracy</text>
      </div>
      </View>
      </div>
  </div>
)

}

export default App;

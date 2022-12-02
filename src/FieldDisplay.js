import React from 'react';
import * as d3 from 'd3';
import Proptypes from 'prop-types'




FieldDisplay.proptypes = {
    reference: React.RefObject,
    x: Proptypes.number,
    y: Proptypes.number
}
export default function FieldDisplay(
props
)
{
console.log(props.reference)    

const return_ref = props.reference.selectAll("text")
                .data([0])
                .enter()
                .append("text")
                .text("Pretend this is a soccer field")
                .attr("x", "40")
                .attr("y", "60");
// const return_ref = props.reference.selectAll("image").data([0])
// .append("image")
// .attr("x", props.x).attr("y", props.y)
// .attr('width', 540).attr("height", '360').attr("src", "./soccer_field.jpg")
return return_ref;
}

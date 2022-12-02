import React from 'react';
import * as d3 from 'd3';
import Proptypes from 'prop-types'

SVGBuilder.proptypes = {
    reference: React.RefObject,
    x: Proptypes.number,                // x size
    y: Proptypes.number,                // y size
    margin_top: Proptypes.number,
    margin_bottom: Proptypes.number,
    margin_left: Proptypes.number,
    margin_right: Proptypes.number,
}

export default function SVGBuilder(props)
{
const width = props.x - (props.margin_left + props.margin_right);
const height = props.y - (props.margin_top + props.margin_bottom);
let svg_return = d3.select(props.reference.current).append('svg')
.attr("height", height)
.attr("width", width)
.append("g").attr("transform", "translate(" + props.margin_left + "," + props.margin_top + ")")
console.log("SVG ref", svg_return)
return svg_return;
}
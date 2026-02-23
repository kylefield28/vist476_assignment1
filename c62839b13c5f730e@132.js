function _1(md){return(
md`# test
svg = {
  const svg = d3.create("svg")
    .attr("width", 400)
    .attr("height", 200);

  svg.append("circle")
    .attr("cx", 200)
    .attr("cy", 100)
    .attr("r", 50)
    .attr("fill", "steelblue");

  return svg.node();
}
`
)}

function _d3(require){return(
require("d3@7")
)}

function _data(FileAttachment){return(
FileAttachment("temperature_daily.csv").csv({ typed: true })
)}

function _parsed(data){return(
data.map(d => {
  const date = new Date(d.date);
  return {
    date,
    year: date.getFullYear(),
    month: date.getMonth(),
    max_temperature: d.max_temperature,
    min_temperature: d.min_temperature
  };
})
)}

function _filtered(parsed){return(
parsed.filter(d => d.year >= 2006 && d.year <= 2017)
)}

function _nested(d3,filtered){return(
d3.groups(
  filtered,
  d => d.year,
  d => d.month
)
)}

function _matrixDataFull(nested,d3){return(
nested.flatMap(([year, months]) =>
  months.map(([month, days]) => ({
    year,
    month,
    maxValue: d3.max(days, d => d.max_temperature),
    minValue: d3.min(days, d => d.min_temperature)
  }))
)
)}

function _mode(){return(
"max_temperature"
)}

function _matrixData(nested,d3,mode){return(
nested.flatMap(([year, months]) =>
  months.map(([month, days]) => ({
    year,
    month,
    avg: d3.mean(days, d => d[mode])
  }))
)
)}

function _monthly(d3,filtered){return(
d3.rollups(
  filtered,
  v => d3.mean(v, d => d.temp),
  d => d.year,
  d => d.month
)
)}

function _years(filtered){return(
[...new Set(filtered.map(d => d.year))].sort()
)}

function _months(d3){return(
d3.range(12)
)}

function _globalExtent(d3,filtered){return(
d3.extent(filtered.flatMap(d => [
  d.max_temperature,
  d.min_temperature
]))
)}

function _color(d3,globalExtent){return(
d3.scaleSequential()
  .domain(globalExtent.slice().reverse())
  .interpolator(d3.interpolateRdYlBu)
)}

function _dailyByMonth(d3,filtered){return(
new Map(
  d3.groups(filtered, d => `${d.year}-${d.month}`)
    .map(([key, days]) => [
      key,
      days
        .slice()
        .sort((a, b) => a.date - b.date)
        .map(d => ({
          day: d.date.getDate(),
          max: d.max_temperature,
          min: d.min_temperature
        }))
    ])
)
)}

function _tooltip(d3)
{
  const div = d3.select(document.body)
    .append("div")
    .attr("class", "hk-tooltip")
    .style("position", "fixed")       
    .style("pointer-events", "none")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 8px")
    .style("border-radius", "6px")
    .style("font", "12px sans-serif")
    .style("opacity", 0)
    .style("z-index", 9999);

  return div;
}


function _svg(months,years,d3,$0,mode,matrixDataFull,color,tooltip,dailyByMonth,globalExtent)
{

  const cellSize = 50;

  const margin = { top: 40, right: 20, bottom: 60, left: 60 };

  const width = months.length * cellSize;
  const height = years.length * cellSize;

  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  svg.on("click", () => {
  $0.value = mode === "max_temperature"
    ? "min_temperature"
    : "max_temperature";
});
  svg.append("text")
  .attr("x", (width + margin.left + margin.right) / 2)
  .attr("y", 15)
  .attr("text-anchor", "middle")
  .attr("font-size", 18)
  .attr("font-weight", "bold")
  .text(
    mode === "max_temperature"
      ? "Hong Kong Monthly Maximum Temperature (2007–2017)"
      : "Hong Kong Monthly Minimum Temperature (2007–2017)"
  );

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Add month labels
// Year labels (top)
g.selectAll(".year-label")
  .data(years)
  .enter()
  .append("text")
  .attr("class", "year-label")
  .attr("x", (d, i) => i * cellSize + cellSize / 2)
  .attr("y", -5)
  .attr("text-anchor", "middle")
  .attr("font-size", 12)
  .text(d => d);

g.selectAll(".month-label")
  .data(months)
  .enter()
  .append("text")
  .attr("class", "month-label")
  .attr("x", -5)
  .attr("y", (d, i) => i * cellSize + cellSize / 2)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("font-size", 12)
  .text(d => monthNames[d]);

// ----- CELLS (background + mini line chart) -----
const innerPad = 6;

// One <g> per cell
const cell = g.selectAll(".cell")
  .data(matrixDataFull)
  .enter()
  .append("g")
  .attr("class", "cell")
  .attr("transform", d =>
    `translate(${years.indexOf(d.year) * cellSize},${d.month * cellSize})`
  );

cell.append("rect")
  .attr("width", cellSize)
  .attr("height", cellSize)
  .attr("fill", d => color(mode === "max_temperature" ? d.maxValue : d.minValue))
  .attr("stroke", "white")
  .on("mousemove", (event, d) => {
  const mm = String(d.month + 1).padStart(2, "0");

  tooltip
    .style("opacity", 1)
    .style("left", (event.clientX + 12) + "px")
    .style("top", (event.clientY + 12) + "px")
    .html(`
      <div>
        Date: ${d.year}-${mm}<br/>
        Max: ${d.maxValue}°C<br/>
        Min: ${d.minValue}°C
      </div>
    `);
})
.on("mouseleave", () => tooltip.style("opacity", 0));

cell.each(function(d) {
  const key = `${d.year}-${d.month}`;
  const series = dailyByMonth.get(key);   // <-- series is defined here

  if (!series || series.length === 0) return;

  const innerPad = 6;

  const x = d3.scaleLinear()
    .domain(d3.extent(series, p => p.day))
    .range([innerPad, cellSize - innerPad]);

  const y = d3.scaleLinear()
    .domain(globalExtent)
    .range([cellSize - innerPad, innerPad]);

  const maxLine = d3.line()
    .x(p => x(p.day))
    .y(p => y(p.max));

  const minLine = d3.line()
    .x(p => x(p.day))
    .y(p => y(p.min));

  // Max line (black)
  d3.select(this)
    .append("path")
    .datum(series)
    .attr("d", maxLine)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");

  // Min line (white)
  d3.select(this)
    .append("path")
    .datum(series)
    .attr("d", minLine)
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("pointer-events", "none");
});

  // ----- LEGEND -----

const legendWidth = 200;
const legendHeight = 10;

const legendX = 0;
const legendY = height + 20;

  // Create gradient
const defs = svg.append("defs");

const gradient = defs.append("linearGradient")
  .attr("id", "legend-gradient");

gradient.selectAll("stop")
  .data(d3.range(0, 1.01, 0.01))
  .enter()
  .append("stop")
  .attr("offset", d => `${d * 100}%`)
  .attr("stop-color", d => color(
      d3.interpolate(
        globalExtent[0],
        globalExtent[1]
      )(d)
  ));

  svg.append("rect")
  .attr("x", margin.left + legendX)
  .attr("y", margin.top + legendY)
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .attr("fill", "url(#legend-gradient)");

  const legendScale = d3.scaleLinear()
  .domain(globalExtent)
  .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
  .ticks(5);

svg.append("g")
  .attr("transform", `translate(${margin.left + legendX},${margin.top + legendY + legendHeight})`)
  .call(legendAxis);

  return svg.node();
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["temperature_daily.csv", {url: new URL("./files/b14b4f364b839e451743331d515692dfc66046924d40e4bff6502f032bd591975811b46cb81d1e7e540231b79a2fa0f4299b0e339e0358f08bef900595e74b15.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("data")).define("data", ["FileAttachment"], _data);
  main.variable(observer("parsed")).define("parsed", ["data"], _parsed);
  main.variable(observer("filtered")).define("filtered", ["parsed"], _filtered);
  main.variable(observer("nested")).define("nested", ["d3","filtered"], _nested);
  main.variable(observer("matrixDataFull")).define("matrixDataFull", ["nested","d3"], _matrixDataFull);
  main.define("initial mode", _mode);
  main.variable(observer("mutable mode")).define("mutable mode", ["Mutable", "initial mode"], (M, _) => new M(_));
  main.variable(observer("mode")).define("mode", ["mutable mode"], _ => _.generator);
  main.variable(observer("matrixData")).define("matrixData", ["nested","d3","mode"], _matrixData);
  main.variable(observer("monthly")).define("monthly", ["d3","filtered"], _monthly);
  main.variable(observer("years")).define("years", ["filtered"], _years);
  main.variable(observer("months")).define("months", ["d3"], _months);
  main.variable(observer("globalExtent")).define("globalExtent", ["d3","filtered"], _globalExtent);
  main.variable(observer("color")).define("color", ["d3","globalExtent"], _color);
  main.variable(observer("dailyByMonth")).define("dailyByMonth", ["d3","filtered"], _dailyByMonth);
  main.variable(observer("tooltip")).define("tooltip", ["d3"], _tooltip);
  main.variable(observer("svg")).define("svg", ["months","years","d3","mutable mode","mode","matrixDataFull","color","tooltip","dailyByMonth","globalExtent"], _svg);
  return main;
}

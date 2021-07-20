// sources available are:
// kickstarter pledges: https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/kickstarter-funding-data.json
// movie receipts: https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json
// video game sales: https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/video-game-sales-data.json

fetch('https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json')
.then(res => res.json())
.then(data => {
    const GRAPH_PADDING = 100;
    const GRAPH_WIDTH = 1400;
    const GRAPH_HEIGHT = 800;

    // helper to collect important data from dataset
    function countChildren(data) {
        let count = 0;
        let elements = 0;
        let genres = [];
        data.children.forEach(element => {
            count += element.children.length;
            elements += 1;
            genres.push(element.name);
        });
        return [count, elements, genres];
    }

    const [itemCount, itemElems, itemGenres] = countChildren(data);
    const itemDesc = data.name === 'Kickstarter' ?
    `Top ${itemCount} Kickstarter pledges by product type` :
    data.name === 'Movies' ?
    `Top ${itemCount} grossing movies at the US box office by genre` :
    `Top ${itemCount} selling video games by console` ;
    const formatCurrency = d3.format(',');

    // graph title
    d3.select('#title')
    .html(`${data.name}`);

    // graph description
    d3.select('#description')
    .html(`${itemDesc}`);

    // set up svg canvas
    const mainMap = d3.select('.svgContainer')
    .append('svg')
    .attr('width', GRAPH_WIDTH)
    .attr('height', GRAPH_HEIGHT);

    // set up tooltip
    const tooltip = d3.select('.svgContainer')
    .append('div')
    .attr('id', 'tooltip')
    .style('position', 'absolute')
    .style('opacity', 0);

    // set up color scheme for categories - taken from ColorBrewer
    const categoryColors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'].concat(
        ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f']
    );
    const scaleColors = d3.scaleOrdinal()
        .domain(itemGenres)
        .range(categoryColors.slice(0, itemGenres.length));

    // draw diagram
    var root = d3.hierarchy(data).sum(d => d.value);
    d3.treemap()
    .size([GRAPH_WIDTH, GRAPH_HEIGHT - GRAPH_PADDING])
    .padding(1)
    (root);

    mainMap.selectAll('rect')
    .data(root.leaves())
    .enter()
    .append('rect')
    .attr('class', 'tile')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('data-name', d => d.data.name)
    .attr('data-category', d => d.data.category)
    .attr('data-value', d => d.data.value)
    .attr('fill', d => scaleColors(d.data.category))
    .on('mouseover', function(e, d) {
        d3.select(this)
        .style('outline', 'solid 0.2px');
        tooltip
        .html(`${d.data.name}<br>${d.data.category}<br>
            Box Office Receipts: ${'$' + formatCurrency(d.value)}`)
        .attr('data-value', this.getAttribute('data-value'))
        .style('opacity', 0.9)
        .style('left', e.clientX + 16 + 'px')
        .style('top', e.clientY - 16 + 'px');
    })
    .on('mouseout', function(e, d) {
        d3.select(this)
        .style('outline', 'none');
        tooltip
        .style('opacity', 0)
        .style('top', 0);
    });
    
    mainMap.selectAll('text')
    .data(root.leaves())
    .enter()
    .append('text')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0 + 5)
    .attr('dy', '0.5em')
    .attr('class', 'tile-label')
    .attr('width', d => d.x1 - d.x0 - 10)
    .attr('height', d => d.y1 - d.y0 - 20)
    .text(d => d.data.name)
    .style('overflow-wrap', 'normal');

    // tweaked text wrap example from d3 tutorial to work for this example
    mainMap.selectAll('.tile-label')
    .call(wrap);   
    function wrap(text) {
        text.each(function() {
          var text = d3.select(this),
              words = text.text().split(/\s+/).reverse(),
              word,
              line = [],
              lineNumber = 0,
              lineHeight = 1.1, // ems
              x = text.attr('x'), // added x attribute to properly line up items
              y = text.attr("y"),
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > text.attr('width')) { // replaced width argument with innate property
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
          }
        });
      }

    // add legend
    const LEGEND_X = 5;
    const LEGEND_Y = GRAPH_HEIGHT - GRAPH_PADDING + 5;
    const LEGEND_ITEM_WIDTH = GRAPH_WIDTH / 5;
    const LEGEND_ITEM_HEIGHT = GRAPH_PADDING / 5;
    const LEGEND_BOX_SIDE = GRAPH_PADDING / 6;
    const legend = mainMap
    .append('g')
    .attr('id', 'legend')
    .attr('x', LEGEND_X)
    .attr('y', LEGEND_Y)

    legend
    .selectAll('rect')
    .data(scaleColors.range())
    .enter()
    .append('rect')
    .attr('class', 'legend-item')
    .attr('fill', d => d)
    .attr('x', (d, i) => LEGEND_X + i % 5 * LEGEND_ITEM_WIDTH)
    .attr('y', (d, i) => LEGEND_Y + Math.floor(i / 5) * LEGEND_ITEM_HEIGHT)
    .attr('width', LEGEND_BOX_SIDE)
    .attr('height', LEGEND_BOX_SIDE);

    legend
    .selectAll('text')
    .data(itemGenres)
    .enter()
    .append('text')
    .attr('x', (d, i) => LEGEND_X + i % 5 * LEGEND_ITEM_WIDTH + 1.2 * LEGEND_BOX_SIDE)
    .attr('y', (d, i) => LEGEND_Y + 12 + (Math.floor(i / 5)) * LEGEND_ITEM_HEIGHT)
    .text(d => d)
})
export class SankeyChart {
  constructor() {
    const attrs = {
      id: 'ID' + Math.floor(Math.random() * 1000000),
      svgWidth: 1000,
      svgHeight: 550,
      marginTop: 5,
      marginBottom: 5,
      marginRight: 50,
      marginLeft: 50,
      container: 'body',
      defaultTextFill: '#2C3E50',
      defaultFont: 'Helvetica',
      data: null,
      chartWidth: null,
      chartHeight: null,
      maxBarWidth: 20,
      minBarMargin: 20,
      numLayers: null,
      colors: [
        '#0a4519',
        '#273b0e',
        '#57231f',
        '#57301f',
        '#545318',
        '#a89608',
        '#36694d',
        '#364d69',
        '#366569',
        '#20145c',
        '#5c3194',
        '#8d0cad',
        '#ad0c70',
        '#ed0754',
        '#f0565e',
      ],
      generatedContent: (d) => {
        return `<div class="nodeName" style="display:flex;">${d.name}</div>`;
      },
    };
    this.getState = () => attrs;
    this.setState = (d) => Object.assign(attrs, d);
    Object.keys(attrs).forEach((key) => {
      //@ts-ignore
      this[key] = function (_) {
        var string = `attrs['${key}'] = _`;
        if (!arguments.length) {
          return eval(`attrs['${key}'];`);
        }
        eval(string);
        return this;
      };
    });
    this.initializeEnterExitUpdatePattern();
  }
  initializeEnterExitUpdatePattern() {
    d3.selection.prototype._add = function (params) {
      var container = this;
      var className = params.className;
      var elementTag = params.tag;
      var data = params.data || [className];
      var exitTransition = params.exitTransition || null;
      var enterTransition = params.enterTransition || null;
      // Pattern in action
      var selection = container
        .selectAll('.' + className)
        .data(data, (d, i) => {
          if (typeof d === 'object') {
            if (d.id) {
              return d.id;
            }
          }
          return i;
        });
      if (exitTransition) {
        exitTransition(selection);
      } else {
        selection.exit().remove();
      }

      const enterSelection = selection.enter().append(elementTag);
      if (enterTransition) {
        enterTransition(enterSelection);
      }
      selection = enterSelection.merge(selection);
      selection.attr('class', className);
      return selection;
    };
  }

  // ================== RENDERING  ===================
  render() {
    this.setDynamicContainer();
    this.calculateProperties();
    this.drawSvgAndWrappers();
    this.drawSankey();

    return this;
  }

  setDynamicContainer() {
    const attrs = this.getState();

    //Drawing containers
    var d3Container = d3.select(attrs.container);
    var containerRect = d3Container.node().getBoundingClientRect();
    if (containerRect.width > 0) attrs.svgWidth = containerRect.width;

    d3.select(window).on('resize.' + attrs.id, () => {
      var containerRect = d3Container.node().getBoundingClientRect();
      if (containerRect.width > 0) attrs.svgWidth = containerRect.width;
      this.render();
    });

    this.setState({ d3Container });
  }

  drawSvgAndWrappers() {
    const {
      d3Container,
      svgWidth,
      svgHeight,
      defaultFont,
      calc,
      data,
      chartWidth,
      chartHeight,
    } = this.getState();

    // Draw SVG
    const svg = d3Container
      ._add({
        tag: 'svg',
        className: 'svg-chart-container',
      })
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .attr('font-family', defaultFont);

    //Add container g element
    var chart = svg
      ._add({
        tag: 'g',
        className: 'chart',
      })
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr(
        'transform',
        'translate(' + calc.chartLeftMargin + ',' + calc.chartTopMargin + ')'
      );

    this.setState({ chart, svg });
  }

  calculateProperties() {
    const {
      data,
      marginLeft,
      marginTop,
      marginRight,
      marginBottom,
      svgWidth,
      svgHeight,
    } = this.getState();

    //Calculated properties
    var calc = {
      id: null,
      chartTopMargin: null,
      chartLeftMargin: null,
      chartWidth: null,
      chartHeight: null,
      barWidth: null,
      barMargin: null,
    };
    calc.id = 'ID' + Math.floor(Math.random() * 1000000); // id for event handlings
    calc.chartLeftMargin = marginLeft;
    calc.chartTopMargin = marginTop;
    const chartWidth = svgWidth - marginRight - marginLeft;
    const chartHeight = svgHeight - marginBottom - marginTop;

    this.setState({ calc, chartWidth, chartHeight });
  }
  drawSankey() {
    const {
      svg,
      chart,
      data,
      chartWidth,
      generatedContent,
      chartHeight,
      numLayers,
      colors,
    } = this.getState();

    var count = 0;
    var countNodeClick = 0;

    const tool_tip = d3.tip().attr('class', 'd3-tip').offset([-8, 0]);
    svg.call(tool_tip);
    tool_tip.html(function (d, i) {
      if (d.name) {
        return `<table>
       <tr><th colspan=2>${d.name ? '' : ''}</th></tr>
   </table>`;
      } else {
        return `<table>
      <tr><td>Source:</td><td>${d.source.name}</td></tr>
      <tr><td>Target:</td><td>${d.target.name}</td></tr>
  </table>`;
      }
    });

    console.log(data);
    var sankey = d3
      .sankey()
      .nodeId((d) => d.name)
      .nodeAlign(d3.sankeyCenter)
      .nodeSort(null)
      .nodeWidth(50)
      .nodePadding(10)
      .extent([
        [0, 10],
        [chartWidth, chartHeight - 10],
      ]);

    const { nodes, links } = sankey({
      nodes: data.nodes.map((d) => Object.assign({}, d)),
      links: data.links.map((d) => Object.assign({}, d)),
    });
    console.log({ nodes });

    console.log(links);

    var scale = d3
      .scaleLinear()
      .domain([
        d3.min(links, function (d) {
          return d.value;
        }),
        d3.max(links, function (d) {
          return d.value;
        }),
      ])
      .range([10, 25]);

    nodes.forEach((d, i) => {
      d.color = colors[i % colors.length];
    });

    const nodeg = chart._add({ tag: 'g', className: 'gchart-Wrapper' });

    const node = nodeg
      ._add({ tag: 'rect', data: nodes, className: 'Node' })
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('fill', function (d, i) {
        return d.color;
      })
      .attr('rx', 6)
      .attr('cursor', 'pointer')
      .on('click', function (d, i) {
        countNodeClick++;
        if (countNodeClick % 2 == 1) {
          d3.selectAll('.from' + d.index).style('opacity', '1');
          d3.selectAll('.to' + d.index).style('opacity', '1');
        } else {
          d3.selectAll('.from' + d.index).style('opacity', '0.2');
          d3.selectAll('.to' + d.index).style('opacity', '0.2');
        }
      })
      .on('mouseout', tool_tip.hide)
      .on('mouseover', tool_tip.show);

    const link = chart
      ._add({ tag: 'g', className: 'glink-Wrapper' })
      .attr('fill', 'none')
      ._add({ tag: 'g', data: links, className: 'links' })
      .attr('stroke', function (d, i) {
        return d.source.color;
      })
      .attr('opacity', 0.4)
      .attr('cursor', 'pointer')
      .attr('class', function (d) {
        return 'from' + d.source.index + ' to' + d.target.index;
      })
      .on('click', function () {
        count++;
        if (count % 2 == 0) {
          d3.select(this).style('opacity', '0.2');
        } else {
          d3.select(this).style('opacity', '1');
        }
      })
      .on('mouseout', tool_tip.hide)
      .on('mouseover', tool_tip.show)
      ._add({ tag: 'path', data: (d) => [d], className: 'link-path' })
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke-width', function (d) {
        return scale(d.value);
      });

    chart
      ._add({ tag: 'foreignObject', data: nodes, className: 'node-texts' })
      .attr('width', 130)
      .attr('height', 120)
      .attr('transform', function (d) {
        if (d.height == 0) {
          return `translate(${d.x0 - 80} , ${d.y0} )`;
        } else if (d.height == numLayers - 1) {
          return `translate(${d.x0} , ${d.y0} )`;
        } else {
          return `translate(${d.x0 - 40} , ${d.y0} )`;
        }
      })
      ._add({ tag: 'xhtml:div', data: (d) => [d], className: 'node-txt' })
      .attr('class', function (d) {
        if (d.height == 0) {
          return 'lastNodes';
        } else if (d.height == numLayers - 1) {
          return 'firstNodes';
        } else {
          return 'restNodes';
        }
      })
      .style('width', 130 + 'px')
      //   .style("height", 80 + "px")
      .html(function (d) {
        return generatedContent(d);
      });
  }
}

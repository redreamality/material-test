(function(){
  
  Renderer = function(canvas){
    var canvas = $(canvas).get(0)
    var ctx = canvas.getContext("2d")
    var gfx = arbor.Graphics(canvas)
    var particleSystem = null

    var that = {
      init:function(system){
        particleSystem = system
        particleSystem.screenSize(canvas.width, canvas.height) 
        particleSystem.screenPadding(40)


        that.initMouseHandling()
      },

      redraw:function(){
        if (!particleSystem) return

        //particleSystem.screenSize(canvas.width, canvas.height)
        particleSystem.screenPadding(40)
        //console.log(canvas)


        gfx.clear() // convenience ƒ: clears the whole canvas rect

        // draw the nodes & save their bounds for edge drawing
        var nodeBoxes = {}


        var group_location_x = function (val,group) {

          var xf;
          switch(group){
            case 1:
              xf= function(val){return val/2}
              break;
            case 2:
              xf=function(val){return canvas.width/2+val/2}//window
              break;
            default:
              xf=function(val){return val}
          }
          return xf(val,group)

        }

        var palette = {
          0:"rgba(0,133,115,0.5)",//green

          //1:"#ae7bb3",
            2:"rgba(80,229,249,0.9)",//blue
          //2:"rgba(106, 78, 90, 0.8)",//purple
          1:"rgba(245, 88, 119, 0.9)",//red
          999:"rgba(0,0,0,.2)"
        }



        particleSystem.eachNode(function(node, pt){
          // node: {mass:#, p:{x,y}, name:"", data:{}}
          // pt:   {x:#, y:#}  node position in screen coords

          // determine the box size and round off the coords if we'll be 
          // drawing a text label (awful alignment jitter otherwise...)

          pt.x=group_location_x(pt.x,node.data.g||999);

          var choose_node_color = function () {
            if (node.data.color=="none")return "white"

            if (node.data.color)
              return node.data.color
            else
              return palette[node.data.g]

          }




          var label = node.data.label||""
          var w = ctx.measureText(""+label).width + 10
          if (!(""+label).match(/^[ \t]*$/)){
            pt.x = Math.floor(pt.x)
            pt.y = Math.floor(pt.y)
          }else{
            label = null
          }

          // draw a rectangle centered at pt
          ctx.fillStyle=choose_node_color()


          if (node.data.shape=='dot'){
            gfx.oval(pt.x-w/2, pt.y-w/2, w,w, {fill:ctx.fillStyle})
            nodeBoxes[node.name] = [pt.x-w/2, pt.y-w/2, w,w]
          }else{
            gfx.rect(pt.x-w/2, pt.y-10, w+20,30, 10, {fill:ctx.fillStyle})
            nodeBoxes[node.name] = [pt.x-w/2, pt.y-11, w, 22]
          }

          // draw the text
          if (label){
            ctx.font = "28px Helvetica"
            ctx.textAlign = "center"
            ctx.fillStyle = "white"
            if (node.data.color=='none') ctx.fillStyle = '#333333'
            ctx.fillText(label||"", pt.x+10, pt.y+15)
            ctx.fillText(label||"", pt.x+10, pt.y+15)
          }
        })


        // draw the edges
        particleSystem.eachEdge(function(edge, pt1, pt2){
          // edge: {source:Node, target:Node, length:#, data:{}}
          // pt1:  {x:#, y:#}  source position in screen coords
          // pt2:  {x:#, y:#}  target position in screen coords

          var weight = edge.data.weight*edge.data.weight*40
          var color = edge.data.color
          var sg = edge.source.data.g
          var tg = edge.target.data.g
          //var n1l = $("#n1l")

          //choose edge color
          var choose_color = (color) ?
              color :((!(isNaN(sg)||isNaN(tg)) )?
                  ((sg==tg)?
                      palette[sg]:palette[0])
                  :"#cccccc"
          )

          pt1.x=group_location_x(pt1.x,sg||0);
          pt2.x=group_location_x(pt2.x,tg||0);


          if (!color || (""+color).match(/^[ \t]*$/)) color = null

          // find the start point
          var tail = intersect_line_box(pt1, pt2, nodeBoxes[edge.source.name])
          var head = intersect_line_box(tail, pt2, nodeBoxes[edge.target.name])

          ctx.save() 
            ctx.beginPath()
            ctx.lineWidth = (!isNaN(weight)) ? parseFloat(weight) : 2.5
            ctx.strokeStyle = choose_color
            ctx.fillStyle = null

            ctx.moveTo(tail.x, tail.y)
            ctx.lineTo(head.x, head.y)
            ctx.stroke()
          ctx.restore()

          // draw an arrowhead if this is a -> style edge
          if (edge.data.directed){
            ctx.save()
              // move to the head position of the edge we just drew
              var wt = !isNaN(weight) ? parseFloat(weight) : 1
              var arrowLength = 6 + wt
              var arrowWidth = 2 + wt
              ctx.fillStyle = choose_color
              ctx.translate(head.x, head.y);
              ctx.rotate(Math.atan2(head.y - tail.y, head.x - tail.x));

              // delete some of the edge that's already there (so the point isn't hidden)
              ctx.clearRect(-arrowLength/2,-wt/2, arrowLength/2,wt)

              // draw the chevron
              ctx.beginPath();
              ctx.moveTo(-arrowLength, arrowWidth);
              ctx.lineTo(0, 0);
              ctx.lineTo(-arrowLength, -arrowWidth);
              ctx.lineTo(-arrowLength * 0.8, -0);
              ctx.closePath();
              ctx.fill();
            ctx.restore()
          }
        })
      },



      initMouseHandling:function(){
        // no-nonsense drag and drop (thanks springy.js)
        selected = null;
        nearest = null;
        var dragged = null;
        var oldmass = 1

        // set up a handler object that will initially listen for mousedowns then
        // for moves and mouseups while dragging
        var handler = {
          clicked:function(e){
            var pos = $(canvas).offset();


            _mouseP = arbor.Point(
                ((e.pageX-pos.left)<$(window).width()/3+32)?
                ((e.pageX-pos.left)*2):((e.pageX-pos.left)-$(window).width()/3+32)*2
                , e.pageY-pos.top)

            selected = nearest = dragged = particleSystem.nearest(_mouseP);//change here to _mouseP/2(or bias+_mouseP/2) depending on which half mouse is in



            if (dragged.node !== null) dragged.node.fixed = true




            //==============handling the node clicking show detail==============
            var near_edges = $.merge(sys.getEdgesFrom(  dragged.node),sys.getEdgesTo(  dragged.node))
            var selected_edges = null
            //console.log(near_edges)
            $.each(near_edges, function (index, edge) {
              if (edge.source.data.g!==edge.target.data.g){
                $("#detail-card .title").html( 'Edge Detail: '+edge.source.data.label+'--'+edge.target.data.label)
                selected_edge = edge.source.name+'--'+edge.target.name
              }
            })

            //-------------following d3 -----------------------
            //var width = $(window).width()/3,
            //    height = 500;

            var color = d3.scale.category20b();

            console.log(selected_edge)

            var width = $(window).width()/3,
                height = 600;



            var svg = d3
                .select("#dg")
                //.append("svg")
                .attr("width", width)
                .attr("height", height)
                .html("")
                .append('svg:g')




            var force = d3.layout.force().charge(-180).linkDistance(100).size([width, height]).distance(180);

            d3.json("library/"+selected_edge+".json", function (error, graph) {

              console.log(error)

              //console.log("graph.nodes", graph.nodes)
              //console.log("graph.links", graph.links)

              // start force layout
              force.nodes(graph.nodes).links(graph.links).start();

              var link = svg.
                  selectAll(".link")
                  .data(graph.links)
                  .enter().append("line")
                  .attr("class", "link")
                  .style("stroke-width", function (d) {
                    return d.weight*d.weight*d.weight*d.weight*10;
                  });

              var node = svg.selectAll('g.node')
                  .data(graph.nodes)
                  .enter()
                  .append('svg:g')
                  .attr('class', 'node')
                  .call(force.drag)
              var circles = node.append('circle')
                  .attr("r", 14)
                  .style("fill", function (d) {
                    return color(d.group);
                  });
              var texts = node.append('svg:text')
                  .attr("dx", 16)
                  .attr("dy", ".35em")
                  .text(function (d) {
                    return d.id
                  });
              node.append("title").text(function (d) {
                return d.id;
              });


              force.on("tick", function () {
                link.attr("x1", function (d) {
                  return d.source.x;
                }).attr("y1", function (d) {
                  return d.source.y;
                }).attr("x2", function (d) {
                  return d.target.x;
                }).attr("y2", function (d) {
                  return d.target.y;
                });

                /*		circles.attr("cx", function(d) {
                 return d.x;
                 }).attr("cy", function(d) {
                 return d.y;
                 });
                 texts.attr("cx", function(d) {
                 return d.x;
                 }).attr("cy", function(d) {
                 return d.y;
                 });
                 */
                node.attr("transform", function (d) {
                  var x = d.x,
                      y = d.y;
                  if (x > 100 && d.group == '1') {
                    x = 100
                    d.x = x
                  }
                  if (x < 300 && d.group == '2') {
                    x = 300
                    d.x = x
                  }

                  return "translate(" + x + "," + y + ")";
                });


              });
            });


            //======================================



            $(canvas).bind('mousemove', handler.dragged)
            $(window).bind('mouseup', handler.dropped)

            that.redraw()
            return false

          },
          dragged:function(e){
            var old_nearest = nearest && nearest.node._id
            var pos = $(canvas).offset();
            var s = arbor.Point(
                ((e.pageX-pos.left)<$(window).width()/3+32)?
                    ((e.pageX-pos.left)*2):((e.pageX-pos.left)-$(window).width()/3+32)*2
                , e.pageY-pos.top)

            if (!nearest) return
            if (dragged !== null && dragged.node !== null){
              var p = particleSystem.fromScreen(s)
              dragged.node.p = p
            }

            return false
          },

          dropped:function(e){
            if (dragged===null || dragged.node===undefined) return
            if (dragged.node !== null) dragged.node.fixed = false
            dragged.node.tempMass = 50
            dragged = null
            selected = null
            $(canvas).unbind('mousemove', handler.dragged)
            $(window).unbind('mouseup', handler.dropped)
            _mouseP = null
            return false
          }
        }
        $(canvas).mousedown(handler.clicked);

      }

    }

    // helpers for figuring out where to draw arrows (thanks springy.js)
    var intersect_line_line = function(p1, p2, p3, p4)
    {
      var denom = ((p4.y - p3.y)*(p2.x - p1.x) - (p4.x - p3.x)*(p2.y - p1.y));
      if (denom === 0) return false // lines are parallel
      var ua = ((p4.x - p3.x)*(p1.y - p3.y) - (p4.y - p3.y)*(p1.x - p3.x)) / denom;
      var ub = ((p2.x - p1.x)*(p1.y - p3.y) - (p2.y - p1.y)*(p1.x - p3.x)) / denom;

      if (ua < 0 || ua > 1 || ub < 0 || ub > 1)  return false
      return arbor.Point(p1.x + ua * (p2.x - p1.x), p1.y + ua * (p2.y - p1.y));
    }

    var intersect_line_box = function(p1, p2, boxTuple)
    {
      var p3 = {x:boxTuple[0], y:boxTuple[1]},
          w = boxTuple[2],
          h = boxTuple[3]

      var tl = {x: p3.x, y: p3.y};
      var tr = {x: p3.x + w, y: p3.y};
      var bl = {x: p3.x, y: p3.y + h};
      var br = {x: p3.x + w, y: p3.y + h};

      return intersect_line_line(p1, p2, tl, tr) ||
            intersect_line_line(p1, p2, tr, br) ||
            intersect_line_line(p1, p2, br, bl) ||
            intersect_line_line(p1, p2, bl, tl) ||
            false
    }

    return that
  }    
  
})()
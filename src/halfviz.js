//
// halfviz.js
//
// instantiates all the helper classes, sets up the particle system + renderer
// and maintains the canvas/editor splitview
//
//(function(){

  trace = arbor.etc.trace
  objmerge = arbor.etc.objmerge
  objcopy = arbor.etc.objcopy
  var parse = Parseur().parse



  var HalfViz = function(elt){
    var dom = $(elt)

    sys = arbor.ParticleSystem({
      friction:.5,
      stiffness:0,
      repulsion:150000,
      precision:0.2,
      fps:60,
      dt:0.005,
    })


    sys.renderer = Renderer("#viewport") // our newly created renderer will have its .() method called shortly by sys...
    sys.screenPadding(20)

    var _ed = dom.find('#editor')
    var _code = dom.find('textarea')
    var _canvas = dom.find('#viewport')
    //var _grabber = dom.find('#grabber')
    var _graph = dom.find('#graph')
    var _updateTimeout = null
    var _current = null // will be the id of the doc if it's been saved before
    var _editing = false // whether to undim the Save menu and prevent navigating away
    var _failures = null

    var _n1l=dom.find('#n1l')



    var that = {
      dashboard:Dashboard("#dashboard", sys),
      io:IO("#editor"),

      init:function(){

        $(window).resize(that.resize)
        that.resize()

        //that.updateLayout()

        _code.keydown(that.typing)
        //_grabber.bind('mousedown', that.grabbed)

        $(that.io).bind('get', that.getDoc)
        //$(that.io).bind('clear', that.newDoc)
        return that
      },

      getDoc:function(e){
        $.getJSON('library/'+e.id+'.json', function(doc){

        //$.getJSON('library/virtual-sn.json', function(doc){
          // update the system parameters
          if (doc.sys){
            sys.parameters(doc.sys)
            that.dashboard.update()
          }

          // modify the graph in the particle system
          _code.val(doc.src)
          that.updateGraph()
          that.resize()
          _editing = false
        })

      },

      //newDoc:function(){
      //  var lorem = "; some example nodes\nhello {color:red, label:HELLO}\nworld {color:orange}\n\n; some edges\nhello -> world {color:yellow}\nfoo -> bar {weight:5}\nbar -> baz {weight:2}"
      //
      //  _code.val(lorem).focus()
      //  $.address.value("")
      //  that.updateGraph()
      //  that.resize()
      //  _editing = false
      //},

      updateGraph:function(e){
        var src_txt = _code.val()
        var network = parse(src_txt)

        var n1l =$("#n1l").val()
        var n2l =$("#n2l").val()
        var n1d =$("#n1d").val()
        var n2d =$("#n2d").val()
        var nsim=$("#nsim").val()
        var settings = {
          n1l:n1l,
          n2l:n2l,
          n1d:n1d,
          n2d:n2d,
          nsim:nsim
        }
        //console.log(sys.renderer)
        sys.renderer.dic = settings

        //console.log(settings)


        $.each(network.nodes, function(nname, ndata){
          if (ndata.label===undefined) ndata.label = nname
        })
        sys.merge(network)
        _updateTimeout = null
        sys.renderer.redraw()
      },

      resize:function(){
        var w = $(window).width()*2/3-32
        var h = $(window).height()
        _canvas.width = w
        _canvas.height = h-80 //toolbar height 64
        sys.screenSize(w, h)
        //that.updateLayout()
        sys.renderer.redraw()
        //console.log('resize',_canvas)


      },

      //updateLayout:function(){
      //  var w = _graph.width()
      //  var h = _graph.height()
      //  var canvW = w
      //  var canvH = h
      //  _canvas.width = canvW
      //  _canvas.height = canvH
      //  sys.screenSize(canvW, canvH)
      //  //console.log("layout",_canvas.width)
      //},

      //grabbed:function(e){
      //  $(window).bind('mousemove', that.dragged)
      //  $(window).bind('mouseup', that.released)
      //  return false
      //},
      //dragged:function(e){
      //  var w = dom.width()
      //  that.updateLayout(Math.max(10, Math.min(e.pageX-10, w)) )
      //  sys.renderer.redraw()
      //  return false
      //},
      //released:function(e){
      //  $(window).unbind('mousemove', that.dragged)
      //  return false
      //},
      typing:function(e){
        var c = e.keyCode
        if ($.inArray(c, [37, 38, 39, 40, 16])>=0){
          return
        }

        if (!_editing) {
          $.address.value("")
        }
        _editing = true

        if (_updateTimeout) clearTimeout(_updateTimeout)
        _updateTimeout = setTimeout(that.updateGraph, 900)
      }
    }

    return that.init()
  }


  //$(document).ready(function(){
  //  var mcp = HalfViz("#halfviz")  //
  //})
//
//
//})()
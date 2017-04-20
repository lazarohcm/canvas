/**
 * Created by lazarohcm on 27/03/17.
 */

var element = 'point', mousePos = {x:0, y:0}, color = {r: 0, g: 0, b: 0, a:0}, clicks = 0;
var points = [], lines = [], polygons = [];
var new_line = false;
var line = new Line();
var lastClick = {x: 0, y: 0}
var canvas = document.getElementById('customizer');
var CTX = canvas.getContext('2d');

function reDraw(){
    CTX.clearRect(0,0,canvas.width, canvas.height);
    for(var line in lines){
        lines[line].draw();
        //lines[line].tick();
    }

    for(var point in points){
        points[point].draw();
        //lines[line].tick();
    }

    if(mouseDown && new_line) {
        CTX.beginPath();
        CTX.moveTo(lastClick.x, lastClick.y);
        var point = new Point(mousePos.x, mousePos.y);
        CTX.lineTo(point.x, point.y);
        CTX.stroke();
    }
}

setInterval(reDraw, 60);

//Classes
function Point(x, y){
    this.size = 3;
    this.x = x;
    this.y = y;

    //It actually draws a circle with a static radius of 3
    this.draw = function() {
        CTX.beginPath();
        CTX.arc(this.x, this.y, this.size, 0, Math.PI * 2, true);
        CTX.fill();
    }
}

function Line(one, two) {
    this.one = new Point(one);
    this.two = new Point(two);
    this.draw = function (){
        CTX.closePath();
        CTX.beginPath();
        CTX.moveTo(this.one.x, this.one.y);
        CTX.lineTo(this.two.x, this.two.y);
        CTX.stroke();
    }
}

function Rectangle(x, y, w, h){
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}

var mouseDown = false;

document.addEventListener('DOMContentLoaded', function(){
    if(canvas.getContext('2d')){
        canvas.addEventListener('mousemove', function(evt){
            mousePos = getMousePos(canvas, evt);
            switch(element){
                case 'line':
                    if(mouseDown && clicks > 0){
                        CTX.globalCompositeOperation = 'xor';
                        CTX.closePath();
                        CTX.beginPath();
                        CTX.moveTo(lastClick.x, lastClick.y);
                        var point = new Point(mousePos.x, mousePos.y);
                        CTX.lineTo(point.x, point.y);
                        line.two = point;
                        CTX.stroke();
                        CTX.globalCompositeOperation = 'source-over';
                    }
                    break;
            }
        });

        canvas.addEventListener('mousedown', function() { mouseDown = true })
        canvas.addEventListener('mouseup', function() {
            mouseDown = false;
            clicks = 0;

            if(new_line && (typeof line.two.x != 'undefined' && typeof line.two.y != 'undefined')){
                lines.push(line);
                new_line = false;
                clicks = 0;
                lastClick.x = 0; lastClick.y = 0;
            }
        })

        canvas.addEventListener('click', function(evt){
            var point = new Point(mousePos.x, mousePos.y);

            switch (element){
                case 'point':
                    points.push(point);
                    drawPoint(point);
                    break;
                case 'line':
                    CTX.fillStyle = 'rgba(0, 200, 0, 1)';
                    line = new Line();
                    if(clicks == 0){
                        new_line = true;
                        CTX.beginPath();
                        CTX.moveTo(point.x, point.y);
                        CTX.closePath();
                        lastClick.x = point.x; lastClick.y = point.y;
                        line.one = point;
                        clicks ++;
                    }

                    break;
                case 'polygon':
                    break;
                default:
                    break;
            }
        });
    }else{

    }
}, false);


//Helpers
function getMousePos(canvas, evt){
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    }
}

function drawPoint(point){
    CTX.beginPath();
    CTX.arc(point.x, point.y, point.size, 0, Math.PI * 2, true);
    CTX.fill();
}

$(document).ready(function(){
    $('.elements button').on('click', function(e){
        $('.elements button').removeClass('active');
        $(this).toggleClass('active');
        if($(this).hasClass('point')){
            element = 'point';
        }
        if($(this).hasClass('line')){
            element = 'line';
        }
        if($(this).hasClass('polygon')){
            element = 'polygon';
        }
    })
});
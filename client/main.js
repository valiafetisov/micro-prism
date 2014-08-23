Template.video_box.rendered = function (){
  $(document).ready(function(){

    var video = document.querySelector("video");
    // var audioSelect = document.querySelector("select#audioSource");
    var videoSelect = document.querySelector("select#videoSource");
    var startButton = document.querySelector("button#start");

    navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    function gotSources(sourceInfos) {
      for (var i = 0; i != sourceInfos.length; ++i) {
        var sourceInfo = sourceInfos[i];
        var option = document.createElement("option");
        option.value = sourceInfo.id;
        // if (sourceInfo.kind === 'audio') {
        //   option.text = sourceInfo.label || 'microphone ' + (audioSelect.length + 1);
        //   audioSelect.appendChild(option);
        // } else 
        if (sourceInfo.kind === 'video') {
          option.text = sourceInfo.label || 'camera ' + (videoSelect.length + 1);
          videoSelect.appendChild(option);
        } else {
          console.log('Some other kind of source: ', sourceInfo);
        }
      }
    }

    if (typeof MediaStreamTrack === 'undefined'){
      alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
    } else {
      MediaStreamTrack.getSources(gotSources);
    }


    function successCallback(stream) {
      window.stream = stream; // make stream available to console
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }

    function errorCallback(error){
      console.log("navigator.getUserMedia error: ", error);
    }

    function start(){
      if (!!window.stream) {
        video.src = null;
        window.stream.stop();
      }
      // var audioSource = audioSelect.value;
      var videoSource = videoSelect.value;
      var constraints = {
        // audio: {
        //   optional: [{sourceId: audioSource}]
        // },
        video: {
          optional: [{sourceId: videoSource}]
        }
      };
      navigator.getUserMedia(constraints, successCallback, errorCallback);
    }

    // audioSelect.onchange = start;
    videoSelect.onchange = start;

    start();


    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var back = document.createElement('canvas');
    var backcontext = back.getContext('2d');
    var framedifference = document.getElementById('framedifference');
    var framedifference_context = framedifference.getContext('2d');

    // canvas.height = ch;

    var cw, ch;
    var numPixels = 0;
    var previousFrame = new Array(numPixels);
    function canvas_setup(video) {
      cw = Math.floor(video.clientWidth);
      ch = Math.floor(video.clientHeight);
      canvas.width = cw;
      canvas.height = ch;
      back.width = cw;
      back.height = ch;
      framedifference.width = cw;
      framedifference.height = ch;
      numPixels = canvas.width * canvas.height;
      draw(video,context,backcontext,framedifference_context,cw,ch);
    }

    video.addEventListener('play', function(){
      setTimeout(canvas_setup, 5000, this);
    },false);
    
    function draw(v,c,c_d,c_fd,w,h) {
      if(v.paused || v.ended) return false;

      // draw realtime image
      c.drawImage(v,0,0,w,h);
      var idata = c.getImageData(0,0,w,h);

      // draw delayed image
      setTimeout(function(){ c_d.putImageData(idata,0,0); }, 300);
      var c_d_idata = c_d.getImageData(0,0,w,h);
      
      var c_fd_idata = c_d_idata;
      var data = idata.data;
      var d_data = c_d_idata.data;
      var fd_data = c_fd_idata.data;

      // Loop through the pixels
      for(var i = 0; i < data.length; i+=4) {
          var r = data[i];
          var g = data[i+1];
          var b = data[i+2];

          var d_r = d_data[i];
          var d_g = d_data[i+1];
          var d_b = d_data[i+2];

          // var brightness = (3*r+4*g+b)>>>3;
          fd_data[i] = r-d_r;
          fd_data[i+1] = g-d_g;
          fd_data[i+2] = b-d_b;
      }
      c_fd_idata.data = fd_data;
      c_fd.putImageData(c_fd_idata,0,0);

      // Start over!
      setTimeout(function(){ draw(v,c,c_d,c_fd,w,h); }, 20);
    }

  });
}
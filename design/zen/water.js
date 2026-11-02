/* The image itself is refracted; typography and controls remain still. */
window.ZenWater = (() => {
  const canvas=document.querySelector('#water');
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});
  const noop={render(){},resize(){},scene(){},touch(){}};
  if(!gl)return noop;
  const vertex=`attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment=`precision mediump float;
    varying vec2 uv; uniform sampler2D picture;
    uniform vec2 viewport; uniform vec2 imageSize;
    uniform float time; uniform float strength; uniform float motion;
    uniform vec4 touches[5];
    void main(){
      float aspect=viewport.x/viewport.y;
      vec2 p=vec2(uv.x*aspect,uv.y);
      vec2 center=vec2(.5*aspect,.43);
      vec2 d=p-center; float r=length(d);
      float phase=r*38.-time*1.25;
      float ring=sin(phase)*exp(-r*.7);
      vec2 offset=normalize(d+vec2(.0001))*ring*(.0015+strength*.009);
      offset+=vec2(sin(p.y*13.+time*.29),cos(p.x*11.-time*.23))*(.001+strength*.003);
      float crest=cos(phase)*(.003+strength*.017);
      for(int i=0;i<5;i++){
        vec4 touch=touches[i];float age=time-touch.z;
        vec2 delta=p-vec2(touch.x*aspect,touch.y);
        float dist=length(delta);
        float envelope=exp(-pow((dist-age*.17)*17.,2.))*exp(-age*.72)*touch.w;
        float wave=sin(dist*60.-age*10.);
        offset+=normalize(delta+vec2(.0001))*wave*envelope*.012;
        crest+=cos(dist*60.-age*10.)*envelope*.035;
      }
      vec2 warped=uv+vec2(offset.x/aspect,offset.y)*motion;
      float imageAspect=imageSize.x/imageSize.y;
      vec2 cover=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));
      vec2 tex=(warped-.5)*cover+.5;
      vec3 color=texture2D(picture,clamp(tex,vec2(.002),vec2(.998))).rgb;
      gl_FragColor=vec4(color+crest*motion,1.);
    }`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  let program;
  try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water shader link failed');}catch(e){console.warn(e);return noop;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const uniforms={};for(const n of ['viewport','imageSize','time','strength','motion','touches[0]'])uniforms[n]=gl.getUniformLocation(program,n);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  let ready=false,version=0,time=0,touchIndex=0,width=1,height=1;
  const touches=new Float32Array(20),images=new Map();
  function scene(name){const current=++version;ready=false;canvas.style.opacity='0';let img=images.get(name);if(!img){img=new Image();img.src=`assets/${name}.png`;images.set(name,img);}const upload=()=>{if(current!==version||!img.naturalWidth)return;gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);gl.uniform2f(uniforms.imageSize,img.naturalWidth,img.naturalHeight);ready=true;canvas.style.opacity='1';render(time,0,0);};if(img.complete)upload();else{img.onload=upload;img.onerror=()=>{canvas.style.opacity='0';};}}
  function resize(w,h){width=w;height=h;const d=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.viewport,w,h);}
  function render(t,energy,movement=1){time=t;if(!ready||gl.isContextLost())return;gl.uniform1f(uniforms.time,t);gl.uniform1f(uniforms.strength,energy);gl.uniform1f(uniforms.motion,movement);gl.uniform4fv(uniforms['touches[0]'],touches);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.energy=energy.toFixed(3);}
  function touch(x,y){const i=(touchIndex++%5)*4;touches.set([x/width,1-y/height,time,1],i);}
  canvas.addEventListener('webglcontextlost',()=>{canvas.style.opacity='0';});
  scene('light');return {render,resize,scene,touch};
})();

import { useEffect, useRef, useState } from "react";
export function clampPitch(n: number) {
  return Math.max(-75, Math.min(75, n));
}
export default function Panorama({
  src,
  onUnavailable,
}: {
  src: string;
  onUnavailable: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    view = useRef({ yaw: 0, pitch: 0 }),
    draw = useRef<() => void>(() => {}),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const surface = canvas.current!,
      gl = surface.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
      onUnavailable();
      return;
    }
    let disposed = false;
    const image = new Image();
    let program: WebGLProgram | null = null,
      texture: WebGLTexture | null = null,
      buffer: WebGLBuffer | null = null;
    const shaders: WebGLShader[] = [];
    function shader(type: number, source: string) {
      const sh = gl!.createShader(type)!;
      shaders.push(sh);
      gl!.shaderSource(sh, source);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS))
        throw Error("Shader compilation failed");
      return sh;
    }
    try {
      program = gl.createProgram()!;
      gl.attachShader(
        program,
        shader(
          gl.VERTEX_SHADER,
          "attribute vec2 position; varying vec2 point; void main(){point=position;gl_Position=vec4(position,0.0,1.0);}",
        ),
      );
      gl.attachShader(
        program,
        shader(
          gl.FRAGMENT_SHADER,
          `precision mediump float; varying vec2 point; uniform sampler2D photo; uniform float aspect; uniform float yaw; uniform float pitch;
void main(){vec3 r=normalize(vec3(point.x*aspect,point.y,1.3));r=vec3(r.x,r.y*cos(pitch)-r.z*sin(pitch),r.y*sin(pitch)+r.z*cos(pitch));r=vec3(r.x*cos(yaw)+r.z*sin(yaw),r.y,-r.x*sin(yaw)+r.z*cos(yaw));vec2 uv=vec2(atan(r.x,r.z)/6.2831853+0.5,0.5-asin(clamp(r.y,-1.0,1.0))/3.1415927);gl_FragColor=texture2D(photo,uv);}`,
        ),
      );
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw Error("Shader linking failed");
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const pos = gl.getAttribLocation(program, "position");
      gl.enableVertexAttribArray(pos);
      gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const aspect = gl.getUniformLocation(program, "aspect"),
        yaw = gl.getUniformLocation(program, "yaw"),
        pitch = gl.getUniformLocation(program, "pitch");
      draw.current = () => {
        if (disposed || !readyImage) return;
        surface.width = Math.max(
          1,
          Math.floor(surface.clientWidth * window.devicePixelRatio),
        );
        surface.height = Math.max(
          1,
          Math.floor(surface.clientHeight * window.devicePixelRatio),
        );
        gl.viewport(0, 0, surface.width, surface.height);
        gl.useProgram(program);
        gl.uniform1f(aspect, surface.width / surface.height);
        gl.uniform1f(yaw, (view.current.yaw * Math.PI) / 180);
        gl.uniform1f(pitch, (view.current.pitch * Math.PI) / 180);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };
    } catch {
      onUnavailable();
    }
    let readyImage = false;
    image.onload = () => {
      if (disposed) return;
      if (Math.abs(image.naturalWidth / image.naturalHeight - 2) > 0.05) {
        onUnavailable();
        return;
      }
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image,
        );
        if (gl.getError() !== gl.NO_ERROR) throw Error("Texture upload failed");
        readyImage = true;
        setReady(true);
        draw.current();
      } catch {
        onUnavailable();
      }
    };
    image.onerror = () => {
      if (!disposed) onUnavailable();
    };
    image.src = src;
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) onUnavailable();
    };
    surface.addEventListener("webglcontextlost", contextLost);
    const observer = new ResizeObserver(() => draw.current());
    observer.observe(surface);
    return () => {
      disposed = true;
      observer.disconnect();
      surface.removeEventListener("webglcontextlost", contextLost);
      image.onload = null;
      image.onerror = null;
      draw.current = () => {};
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      shaders.forEach((sh) => gl.deleteShader(sh));
    };
  }, [src, onUnavailable]);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  function turn(x: number, y = 0) {
    view.current = {
      yaw: view.current.yaw + x,
      pitch: clampPitch(view.current.pitch + y),
    };
    draw.current();
  }
  return (
    <div className="panorama-view">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="已核验全景，拖动或方向键转动视角"
        onPointerDown={(e) => {
          pointer.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (pointer.current) {
            turn(
              (pointer.current.x - e.clientX) * 0.25,
              (e.clientY - pointer.current.y) * 0.25,
            );
            pointer.current = { x: e.clientX, y: e.clientY };
          }
        }}
        onPointerUp={() => (pointer.current = null)}
        onPointerCancel={() => (pointer.current = null)}
        onKeyDown={(e) => {
          const delta: { [key: string]: [number, number] } = {
            ArrowLeft: [-10, 0],
            ArrowRight: [10, 0],
            ArrowUp: [0, 10],
            ArrowDown: [0, -10],
          };
          if (delta[e.key]) {
            e.preventDefault();
            e.stopPropagation();
            turn(...delta[e.key]);
          }
        }}
      />
      {!ready && <p>全景加载中…</p>}
      <div className="actions">
        <button onClick={() => turn(-30)}>向左转</button>
        <button onClick={() => turn(30)}>向右转</button>
        <button
          onClick={() => {
            view.current = { yaw: 0, pitch: 0 };
            draw.current();
          }}
        >
          视角归位
        </button>
      </div>
    </div>
  );
}

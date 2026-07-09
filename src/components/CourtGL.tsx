import { useEffect, useRef } from 'react';
import { useTheme } from '../providers/useTheme';

type Props = {
  className?: string;
  /** 'hero' renders the floating ball; 'ambient' is atmosphere only. */
  variant?: 'hero' | 'ambient';
};

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* One full-scene pass: blue-black gradient + floodlights + perspective court
   grid + drifting dust + a procedural basketball (analytic ray/sphere hit,
   rotating seam frame, pebble micro-noise, volt/blue rim lights, glowing
   seams) + light sweep + vignette + dither. u_light morphs the whole scene
   to the Solar Court palette (paper, ink grid, amber rim, ink seams). */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_ptr;
uniform float u_light;
uniform float u_ball;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
mat3 rotY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
}
mat3 rotX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
}

void main() {
  vec2 p = (2.0 * gl_FragCoord.xy - u_res) / u_res.y;
  float aspect = u_res.x / u_res.y;
  float L = u_light;

  vec3 volt = vec3(0.784, 1.0, 0.176);
  vec3 blue = vec3(0.169, 0.435, 1.0);
  vec3 amber = vec3(1.0, 0.768, 0.0);
  vec3 ink = vec3(0.063, 0.063, 0.063);

  // Base gradient: night blue-black, or warm paper.
  vec3 darkBg = mix(vec3(0.016, 0.019, 0.033), vec3(0.043, 0.051, 0.078), smoothstep(-1.0, 1.3, p.y));
  vec3 lightBg = mix(vec3(0.976, 0.972, 0.955), vec3(1.0, 1.0, 0.995), smoothstep(-1.0, 1.0, p.y));
  vec3 col = mix(darkBg, lightBg, L);

  // Floodlight washes.
  float f1 = exp(-pow(length((p - vec2(-aspect * 0.75, 0.95)) * vec2(0.8, 1.1)), 2.0) * 1.4);
  float f2 = exp(-pow(length((p - vec2(aspect * 0.85, 1.05)) * vec2(0.9, 1.2)), 2.0) * 1.6);
  col += (1.0 - L) * (blue * f1 * 0.16 + volt * f2 * 0.08);
  col += L * (amber * f2 * 0.10 - vec3(0.02) * f1);

  // Perspective court floor.
  float yh = -0.18;
  if (p.y < yh) {
    float depth = yh - p.y;
    float fade = smoothstep(0.0, 0.22, depth);
    float z = 1.0 / (depth + 0.045);
    vec2 g = vec2(p.x * z * 0.85, z * 0.5 - u_time * 0.12);
    vec2 gg = fract(g);
    float lw = 0.045;
    float grid = max(
      smoothstep(lw, 0.0, abs(gg.x - 0.5) - 0.46),
      smoothstep(lw, 0.0, abs(gg.y - 0.5) - 0.46)
    );
    vec3 gridCol = mix(blue, ink, L);
    col += gridCol * grid * fade * mix(0.085, 0.05, L);
    // Center-court arc on the floor.
    float arc = abs(length((p - vec2(0.0, yh)) * vec2(1.0, 3.4)) - 0.62);
    col += gridCol * smoothstep(0.012, 0.004, arc) * fade * mix(0.30, 0.16, L);
  }

  // Drifting dust motes (dark theme only).
  vec2 dp = p * 5.5 + vec2(u_time * 0.015, -u_time * 0.03);
  vec2 id = floor(dp);
  vec2 f = fract(dp);
  float rnd = hash21(id);
  vec2 pos = vec2(fract(rnd * 7.13), fract(rnd * 13.7));
  float dd = length(f - pos);
  float tw = 0.5 + 0.5 * sin(u_time * (1.0 + rnd * 2.0) + rnd * 20.0);
  col += (1.0 - L) * mix(blue, volt, rnd) * smoothstep(0.025 + rnd * 0.012, 0.0, dd) * tw * 0.10;

  // The ball.
  if (u_ball > 0.5) {
    float wide = smoothstep(0.95, 1.35, aspect);
    vec2 bc = mix(vec2(0.0, 0.42), vec2(0.66, 0.12), wide);
    float br = mix(0.30, 0.44, wide);
    bc.y += sin(u_time * 0.7) * 0.014;
    bc += u_ptr * vec2(0.022, 0.016);

    vec2 q = p - bc;
    float d2 = dot(q, q);
    float rr = br * br;

    // Halo bleed around the silhouette.
    float dc = length(q) - br;
    vec3 haloCol = mix(mix(blue, volt, clamp(q.x / br * 0.5 + 0.5, 0.0, 1.0)), amber, L);
    col += haloCol * exp(-max(dc, 0.0) * 7.5) * mix(0.10, 0.05, L);

    if (d2 < rr) {
      float z = sqrt(rr - d2);
      vec3 n = normalize(vec3(q, z));
      mat3 R = rotY(u_time * 0.30 + u_ptr.x * 0.45) * rotX(0.42 + u_ptr.y * 0.2);
      vec3 m = R * n;

      // Seam set: two great circles + a pair of offset small circles.
      float e1 = abs(m.z);
      float e2 = abs(m.x);
      float e3 = abs(abs(m.y) - 0.66);
      float minD = min(e1, min(e2, e3));
      float seam = 1.0 - smoothstep(0.012, 0.030, minD);

      // Pebbled leather micro-noise.
      float peb = hash31(floor(m * 110.0)) * 0.05;
      vec3 base = mix(vec3(0.062, 0.070, 0.092) + peb, vec3(0.985, 0.978, 0.958) - peb * 0.7, L);

      vec3 Ldir = normalize(vec3(-0.45, 0.65, 0.62));
      float diff = clamp(dot(n, Ldir), 0.0, 1.0);
      float rim = pow(1.0 - n.z, 2.6);
      vec3 rimCol = mix(mix(blue, volt, clamp(n.x * 0.9 + 0.55, 0.0, 1.0)), amber, L);
      vec3 shade = base * (0.55 + 0.5 * diff);
      shade += rimCol * rim * mix(0.55, 0.34, L);

      // Volt seams glow in the dark; crisp ink channels on paper.
      float pulse = 1.1 + 0.22 * sin(u_time * 1.8);
      vec3 seamCol = mix(volt * pulse, ink, L);
      shade += volt * (1.0 - smoothstep(0.0, 0.11, minD)) * (1.0 - L) * 0.16;

      float spec = pow(clamp(dot(reflect(-Ldir, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 42.0);
      col = mix(shade, seamCol, seam * 0.88) + spec * mix(0.22, 0.4, L);
    }
  }

  // Slow floodlight sweep.
  float sx = fract(u_time * 0.03) * 4.4 - 2.2;
  float sweep = exp(-pow((p.x - p.y * 0.3 - sx) * 1.5, 2.0));
  col += (1.0 - L) * blue * sweep * 0.04 + L * amber * sweep * 0.02;

  // Vignette + dither (kills gradient banding).
  float vig = smoothstep(2.0, 0.45, length(p * vec2(0.75, 1.0)));
  col *= mix(mix(0.72, 1.0, vig), mix(0.94, 1.0, vig), L);
  col += (hash21(gl_FragCoord.xy) - 0.5) * 0.012;

  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    // Surface shader bugs during development; production users just get the CSS fallback.
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * The floodlit-court WebGL backdrop (home hero + ambient app pages). Fully
 * procedural — no textures, no dependencies. Falls back to the CSS floods
 * (rendered by the parent behind this canvas) when WebGL is unavailable.
 * Honors prefers-reduced-motion by rendering a single static frame, and
 * stops the render loop entirely when offscreen or the tab is hidden.
 */
export default function CourtGL({ className = '', variant = 'hero' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      powerPreference: 'low-power',
    });
    if (!gl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let running = false;
    let visible = true;
    let program: WebGLProgram | null = null;
    let uniforms: Record<string, WebGLUniformLocation | null> = {};
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const t0 = performance.now();

    function setup() {
      if (!gl) return false;
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      if (!vs || !fs) return false;
      program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      // One triangle that covers the viewport.
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      uniforms = {
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        ptr: gl.getUniformLocation(program, 'u_ptr'),
        light: gl.getUniformLocation(program, 'u_light'),
        ball: gl.getUniformLocation(program, 'u_ball'),
      };
      return true;
    }

    function resize() {
      if (!canvas || !gl) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function frame() {
      const cnv = canvasRef.current;
      if (!gl || !program || !cnv) return;
      resize();
      ptr.x += (ptr.tx - ptr.x) * 0.06;
      ptr.y += (ptr.ty - ptr.y) * 0.06;
      const t = reduced ? 14.0 : (performance.now() - t0) / 1000;
      gl.uniform2f(uniforms.res, cnv.width, cnv.height);
      gl.uniform1f(uniforms.time, t);
      gl.uniform2f(uniforms.ptr, ptr.x, ptr.y);
      gl.uniform1f(uniforms.light, themeRef.current === 'light' ? 1 : 0);
      gl.uniform1f(uniforms.ball, variant === 'hero' ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop() {
      if (!running) return;
      frame();
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (running || !visible) return;
      if (reduced) {
        frame(); // single static frame
        return;
      }
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    if (!setup()) return;
    frame();
    start();

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) start();
        else stop();
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    const onVis = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVis);

    const onPointer = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (!reduced) window.addEventListener('pointermove', onPointer, { passive: true });

    // Re-render the static frame when the theme flips under reduced motion.
    const mo = new MutationObserver(() => {
      if (reduced) frame();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
    };
    const onRestored = () => {
      if (setup()) start();
    };
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);

    const ro = new ResizeObserver(() => {
      if (reduced) frame();
    });
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none h-full w-full ${className}`.trim()}
    />
  );
}

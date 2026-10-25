/**
 * ThreeUI - PredictiveArcCanvas runtime
 * Source revision: SHA-256 fa86582fc870
 * Variants: Predictive Arc ('predictive'), Ribbon Field ('ribbon-field')
 * Runtime: Canvas 2D + Raw WebGL + Three.js r128
 */

(function(global) {
  const PREDICTIVE_ARC_DEFAULTS = {
    mode: "dark",
    speed: 1,
    spacing: 5,
    dotSize: 6,
    archHeight: 0.7,
    thickness: 1,
    brightness: 1,
    hue: 0,
    saturation: 1,
  };

  const RIBBON_FIELD_DEFAULTS = {
    speed: 1,
    pointerAmount: 1,
    smoothing: 0.035,
    brightness: 1,
    opacity: 1,
    hue: 0,
    saturation: 1,
  };

  const RIBBON_FIELD_VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const RIBBON_FIELD_FRAGMENT_SHADER = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 pointer;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float ribbon(vec2 uv, float offset, float width, float phase) {
  float y = 0.55 + 0.20 * sin((uv.x * 2.15) + phase) + 0.045 * sin((uv.x * 7.0) - phase * 0.7);
  float d = abs(uv.y - y - offset);
  return exp(-(d * d) / width);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec2 p = uv;
  p.x *= resolution.x / resolution.y;

  float t = time * 0.22;
  float drift = (pointer.x - 0.5) * 0.06;

  float rightFade = smoothstep(0.28, 0.72, uv.x);
  float centerDark = 1.0 - smoothstep(0.0, 0.88, distance(uv, vec2(0.18, 0.48)));

  float r1 = ribbon(vec2(uv.x + drift, uv.y), 0.03, 0.0065, t + 0.9);
  float r2 = ribbon(vec2(uv.x - drift * 0.7, uv.y), -0.23, 0.0085, t + 3.25);
  float r3 = ribbon(vec2(uv.x + drift * 0.4, uv.y), 0.25, 0.014, t + 1.85);

  float glow = r1 * 1.14 + r2 * 1.05 + r3 * 0.48;

  vec3 teal = vec3(0.17, 0.83, 0.75);
  vec3 cyan = vec3(0.22, 0.82, 0.96);
  vec3 indigo = vec3(0.39, 0.38, 0.92);
  vec3 purple = vec3(0.66, 0.33, 0.98);
  vec3 blue = vec3(0.23, 0.51, 0.96);

  vec3 col = vec3(0.0);
  col += cyan * r1 * 0.92;
  col += teal * r1 * 0.62;
  col += indigo * r3 * 0.42;
  col += blue * r2 * 0.66;
  col += purple * (r2 + r3) * 0.30;

  float bloom = exp(-pow(distance(uv, vec2(0.76, 0.40 + 0.035 * sin(t))), 2.0) / 0.050);
  bloom += exp(-pow(distance(uv, vec2(0.71, 0.75 + 0.025 * cos(t))), 2.0) / 0.030);
  col += vec3(0.42, 0.85, 1.0) * bloom * 0.34;

  vec2 grid = fract(gl_FragCoord.xy / 7.0) - 0.5;
  float dotShape = smoothstep(0.29, 0.11, length(grid));
  float noise = hash(floor(gl_FragCoord.xy / 7.0));
  float scan = 0.72 + 0.28 * sin((uv.x + uv.y) * 38.0 + time * 1.3);
  float dots = dotShape * (0.48 + 0.52 * noise) * scan;

  float micro = hash(gl_FragCoord.xy + time) * 0.035;
  float alpha = clamp((glow * 1.55 + bloom * 0.50) * dots * rightFade, 0.0, 1.0);
  alpha *= 1.0 - centerDark * 0.56;

  vec3 base = vec3(0.005, 0.005, 0.005);
  vec3 finalColor = mix(base, col, clamp(alpha * 1.55, 0.0, 1.0));
  finalColor += micro * rightFade;

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Unable to create Axiom shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "Axiom shader compilation failed");
    }
    return shader;
  }

  function resolveMode(mode) {
    if (mode === "light" || mode === 1 || mode === "1") return "light";
    return "dark";
  }

  function createPredictiveArcRenderer(canvas, getOptions) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    let width = 1;
    let height = 1;
    let time = 0;

    const resize = (nextWidth, nextHeight) => {
      width = Math.max(1, nextWidth);
      height = Math.max(1, nextHeight);
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const render = () => {
      const options = getOptions();
      const mode = resolveMode(options.mode);
      const isLight = mode === "light";
      context.fillStyle = isLight ? "#eef1f6" : "#030303";
      context.fillRect(0, 0, width, height);
      time += 0.015 * options.speed;

      const centerX = width / 2;
      const archPeakY = height * 0.35;
      const archWidth = width * 1.5;
      const archHeight = height * options.archHeight;
      context.globalCompositeOperation = isLight ? "source-over" : "lighter";

      for (let x = 0; x < width; x += options.spacing) {
        const normX = (x - centerX) / (archWidth / 2);
        const curveY = archPeakY + normX * normX * archHeight;
        for (let y = 0; y < height; y += options.spacing) {
          const distanceToCurve = Math.abs(y - curveY);
          const thickness = (140 + (1 - Math.abs(normX)) * 80) * options.thickness;
          if (distanceToCurve >= thickness) continue;
          let intensity = 1 - distanceToCurve / thickness;
          const waveX = Math.sin(x * 0.015 + time);
          const waveY = Math.cos(y * 0.02 + time);
          intensity = intensity * 0.7 + waveX * waveY * 0.3 * intensity;
          intensity *= Math.max(0, 1 - Math.pow(Math.abs(normX), 2.5));
          if (intensity <= 0.02) continue;

          let r, g, b;
          if (isLight) {
            r = Math.min(255, 48 * intensity + 70 * Math.pow(intensity, 3));
            g = Math.min(255, 28 * intensity + 45 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 110 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const coreBoost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 90 * coreBoost);
              g = Math.min(255, g + 70 * coreBoost);
              b = Math.min(255, b + 110 * coreBoost);
            }
          } else {
            r = Math.min(255, 60 * intensity + 100 * Math.pow(intensity, 3));
            g = Math.min(255, 20 * intensity + 60 * Math.pow(intensity, 4));
            b = Math.min(255, 120 * intensity + 135 * Math.pow(intensity, 2));
            if (intensity > 0.7) {
              const coreBoost = (intensity - 0.7) * 3.3;
              r = Math.min(255, r + 150 * coreBoost);
              g = Math.min(255, g + 150 * coreBoost);
              b = Math.min(255, b + 150 * coreBoost);
            }
          }
          context.fillStyle = `rgb(${Math.floor(r * options.brightness)}, ${Math.floor(g * options.brightness)}, ${Math.floor(b * options.brightness)})`;
          context.fillRect(x, y, options.dotSize * intensity, options.dotSize * intensity);
        }
      }
      context.globalCompositeOperation = "source-over";
    };

    return { resize, render };
  }

  function mountRibbonField(host, props = {}) {
    if (!host) return null;
    const options = { ...RIBBON_FIELD_DEFAULTS, ...props };
    let canvas = host.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      host.appendChild(canvas);
    }

    host.className = `threeui-background ribbon-field${props.className ? ` ${props.className}` : ""}`;
    canvas.style.opacity = options.opacity;
    canvas.style.filter = `hue-rotate(${options.hue}deg) saturate(${options.saturation}) brightness(${options.brightness})`;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) {
      console.warn("WebGL not supported for RibbonFieldBackground");
      return null;
    }

    const vertex = compileShader(gl, gl.VERTEX_SHADER, RIBBON_FIELD_VERTEX_SHADER);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, RIBBON_FIELD_FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Axiom program link failed");
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "resolution");
    const time = gl.getUniformLocation(program, "time");
    const pointerUniform = gl.getUniformLocation(program, "pointer");

    let mouseX = 0.72, mouseY = 0.42, targetX = 0.72, targetY = 0.42, frame = 0, visible = true;
    const startedAt = performance.now();

    const pointer = (event) => {
      const bounds = host.getBoundingClientRect();
      const clientX = event.clientX !== undefined ? event.clientX : (bounds.left + bounds.width * 0.72);
      const clientY = event.clientY !== undefined ? event.clientY : (bounds.top + bounds.height * 0.42);
      targetX = 0.72 + (((clientX - bounds.left) / Math.max(bounds.width, 1)) - 0.72) * options.pointerAmount;
      targetY = 0.42 + ((1 - (clientY - bounds.top) / Math.max(bounds.height, 1)) - 0.42) * options.pointerAmount;
    };

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, bounds.width || window.innerWidth || 1200);
      const h = Math.max(1, bounds.height || window.innerHeight || 800);
      canvas.width = Math.max(1, Math.floor(w * ratio));
      canvas.height = Math.max(1, Math.floor(h * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolution, canvas.width, canvas.height);
    };

    const render = (now) => {
      mouseX += (targetX - mouseX) * options.smoothing;
      mouseY += (targetY - mouseY) * options.smoothing;
      gl.uniform1f(time, (now - startedAt) * 0.001 * options.speed);
      gl.uniform2f(pointerUniform, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = visible && !document.hidden ? requestAnimationFrame(render) : 0;
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    const intersection = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !frame) frame = requestAnimationFrame(render);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }) : null;

    if (resizeObserver) resizeObserver.observe(host);
    if (intersection) intersection.observe(host);
    host.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("resize", resize);

    resize();
    frame = requestAnimationFrame(render);

    return {
      destroy: () => {
        if (frame) cancelAnimationFrame(frame);
        if (resizeObserver) resizeObserver.disconnect();
        if (intersection) intersection.disconnect();
        host.removeEventListener("pointermove", pointer);
        window.removeEventListener("pointermove", pointer);
        window.removeEventListener("resize", resize);
        gl.deleteBuffer(buffer);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        gl.deleteProgram(program);
      },
      update: (newProps) => {
        Object.assign(options, newProps);
        canvas.style.opacity = options.opacity;
        canvas.style.filter = `hue-rotate(${options.hue}deg) saturate(${options.saturation}) brightness(${options.brightness})`;
      }
    };
  }

  function mountPredictiveArc(host, props = {}) {
    if (!host) return null;
    if (props.variant === "ribbon-field") {
      return mountRibbonField(host, props);
    }

    const options = { ...PREDICTIVE_ARC_DEFAULTS, ...props };
    let canvas = host.querySelector("canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      host.appendChild(canvas);
    }

    host.className = `threeui-background predictive-arc predictive-arc--${options.mode}${props.className ? ` ${props.className}` : ""}`;
    host.setAttribute("data-mode", options.mode);
    canvas.style.filter = `hue-rotate(${options.hue}deg) saturate(${options.saturation})`;

    const renderer = createPredictiveArcRenderer(canvas, () => options);
    if (!renderer) return null;

    let frame = 0;
    let visible = true;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      const w = bounds.width || host.parentElement?.clientWidth || window.innerWidth || 1200;
      const h = bounds.height || host.parentElement?.clientHeight || 600;
      renderer.resize(w, h);
      renderer.render();
    };

    const tick = () => {
      renderer.render();
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };

    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    const intersection = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !frame) frame = requestAnimationFrame(tick);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }) : null;

    const visibility = () => {
      if (document.hidden && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!document.hidden && visible && !frame) {
        frame = requestAnimationFrame(tick);
      }
    };

    if (observer) observer.observe(host);
    if (intersection) intersection.observe(host);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);

    resize();
    frame = requestAnimationFrame(tick);

    return {
      destroy: () => {
        if (frame) cancelAnimationFrame(frame);
        if (observer) observer.disconnect();
        if (intersection) intersection.disconnect();
        document.removeEventListener("visibilitychange", visibility);
        window.removeEventListener("resize", resize);
      },
      update: (newProps) => {
        Object.assign(options, newProps);
        canvas.style.filter = `hue-rotate(${options.hue}deg) saturate(${options.saturation})`;
      }
    };
  }

  const exported = {
    PREDICTIVE_ARC_DEFAULTS,
    RIBBON_FIELD_DEFAULTS,
    RIBBON_FIELD_VERTEX_SHADER,
    RIBBON_FIELD_FRAGMENT_SHADER,
    createPredictiveArcRenderer,
    mountPredictiveArc,
    mountRibbonField
  };

  global.ThreeUIPredictiveArc = exported;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);

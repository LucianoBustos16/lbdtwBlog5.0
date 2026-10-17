// Hero "Bengala": humo en WebGL + chispas en canvas 2D + título iluminado por letra.
// Sin dependencias. Se inicializa sobre cualquier <section data-hero-bengala>.

type RGB = [number, number, number];

// smokeDay: color del humo en modo claro (bomba de humo de color, de día)
const PALETTES: Record<string, { flare: RGB; smoke: RGB; smokeDay: RGB; glow: string; ink: string }> = {
	celeste: { flare: [0.38, 0.82, 1.0], smoke: [0.02, 0.6, 0.82], smokeDay: [0.18, 0.62, 0.88], glow: "110 205 255", ink: "3 116 168" },
	lima: { flare: [0.85, 1.0, 0.3], smoke: [0.45, 0.6, 0.12], smokeDay: [0.62, 0.8, 0.12], glow: "201 243 29", ink: "92 120 6" },
	roja: { flare: [1.0, 0.32, 0.18], smoke: [0.55, 0.12, 0.08], smokeDay: [0.9, 0.35, 0.28], glow: "255 110 80", ink: "180 40 20" },
};

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uFlare;   // 0..1, origen abajo-izquierda
uniform float uPower;
uniform vec3 uFlareCol;
uniform vec3 uSmokeCol;
uniform vec3 uSmokeDay;
uniform float uLight;  // 0 = noche (modo oscuro), 1 = día (modo claro)

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}

void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  float asp=uRes.x/uRes.y;
  vec2 p=vec2(uv.x*asp,uv.y);
  vec2 f=vec2(uFlare.x*asp,uFlare.y);
  float t=uTime;

  // Humo que sube, con domain warping
  vec2 q=p*2.1; q.y-=t*.11;
  vec2 w=vec2(fbm(q+vec2(0.,t*.05)),fbm(q+vec2(5.2,1.3)-t*.04));
  float d=fbm(q+1.9*w+vec2(t*.03,0.));

  // Más humo abajo (la tribuna) + penacho que sale de la bengala
  float base=smoothstep(1.2,0.,uv.y)*.55+.3;
  vec2 rel=p-f;
  float h=max(rel.y,0.);
  float width=.05+h*.45;
  float plume=exp(-(rel.x+sin(h*6.-t*1.5)*.04*h)*(rel.x+sin(h*6.-t*1.5)*.04*h)/(width*width))
             *exp(-h*1.3)*smoothstep(-.06,.02,rel.y);
  float dens=smoothstep(.18,.85,d*base+plume*.9*d);

  // Luz de la bengala (cuadrado inverso suavizado)
  float dist=length(rel);
  float light=uPower*.03/(dist*dist+.006);

  vec3 col;
  if(uLight<.5){
    col=vec3(.012,.016,.03);
    col+=uSmokeCol*dens*.38;                                  // ambiente
    col+=uSmokeCol*.22*smoothstep(.6,0.,uv.y)*d*d;           // luces del estadio desde abajo
    col+=uFlareCol*dens*light*1.25;                           // humo iluminado
    col+=uFlareCol*.5*exp(-dist*5.5)*uPower;                  // halo en el aire
    col+=vec3(1.)*smoothstep(.022,.0,dist)*uPower;            // núcleo
    col*=1.-.55*pow(length(uv-.5)*1.25,2.2);                  // viñeta
    col=1.-exp(-col*1.25);                                    // tonemap
  } else {
    // De día la luz no se ve: lo que se ve es el humo de color que larga la bengala
    col=vec3(.957,.961,.969);
    col*=1.-dens*.05;                                         // humo gris suave
    float near=clamp(min(light,3.)*.35,0.,1.);                // más color cerca de la bengala
    float floor_=smoothstep(.7,0.,uv.y)*d*.9;                // humo que sube desde la tribuna
    float tint=clamp(dens*(.75+near)+plume*d*1.3+floor_,0.,1.);
    tint=smoothstep(0.,.85,tint);                             // más contraste entre nube y aire
    col=mix(col,uSmokeDay,tint*.92);                          // humo de color
    col=mix(col,uSmokeDay*.7,smoothstep(.5,1.,tint)*.45);     // zonas densas, más saturadas
    col=mix(col,uFlareCol*.55+.45,exp(-dist*8.)*.5*uPower);   // resplandor
    col=mix(col,vec3(1.),smoothstep(.03,.0,dist)*uPower);     // núcleo
    col*=1.-.08*pow(length(uv-.5)*1.25,2.2);
  }
  col+=(hash(gl_FragCoord.xy+fract(t)*100.)-.5)*.022;      // grano
  gl_FragColor=vec4(col,1.);
}`;

interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; }

export function initHeroBengala(section: HTMLElement) {
	if (section.dataset.ready) return;
	section.dataset.ready = "1";

	const smoke = section.querySelector<HTMLCanvasElement>("[data-smoke]")!;
	const sparksCv = section.querySelector<HTMLCanvasElement>("[data-sparks]")!;
	const title = section.querySelector<HTMLElement>("[data-title]");
	const pal = PALETTES[section.dataset.color ?? "celeste"] ?? PALETTES.celeste;
	section.style.setProperty("--glow", pal.glow);
	section.style.setProperty("--ink", pal.ink);

	// Modo claro/oscuro: se lee del <html class="dark"> y se sigue si el usuario lo cambia
	let isLight = !document.documentElement.classList.contains("dark");

	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	// ---------- Título: partir en letras (manteniendo palabras juntas) ----------
	const letters: HTMLElement[] = [];
	if (title) {
		title.setAttribute("aria-label", title.textContent?.trim() ?? "");
		const walk = (node: Node) => {
			for (const child of Array.from(node.childNodes)) {
				if (child.nodeType === Node.TEXT_NODE) {
					const frag = document.createDocumentFragment();
					for (const part of (child.textContent ?? "").split(/(\s+)/)) {
						if (!part) continue;
						if (/^\s+$/.test(part)) { frag.append(" "); continue; }
						const word = document.createElement("span");
						word.className = "hb-word";
						word.setAttribute("aria-hidden", "true");
						for (const ch of part) {
							const s = document.createElement("span");
							s.className = "hb-ch";
							s.textContent = ch;
							word.append(s);
							letters.push(s);
						}
						frag.append(word);
					}
					child.replaceWith(frag);
				} else if (child.nodeType === Node.ELEMENT_NODE) {
					walk(child);
				}
			}
		};
		walk(title);
	}

	// ---------- WebGL ----------
	const gl = smoke.getContext("webgl", { antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
	let uRes: WebGLUniformLocation | null = null, uTime: WebGLUniformLocation | null = null,
		uFlare: WebGLUniformLocation | null = null, uPower: WebGLUniformLocation | null = null, uLight: WebGLUniformLocation | null = null;

	if (gl) {
		const sh = (type: number, src: string) => {
			const s = gl.createShader(type)!;
			gl.shaderSource(s, src);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
			return s;
		};
		const prog = gl.createProgram()!;
		gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
		gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
		gl.linkProgram(prog);
		gl.useProgram(prog);
		const buf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
		const loc = gl.getAttribLocation(prog, "a");
		gl.enableVertexAttribArray(loc);
		gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
		uRes = gl.getUniformLocation(prog, "uRes");
		uTime = gl.getUniformLocation(prog, "uTime");
		uFlare = gl.getUniformLocation(prog, "uFlare");
		uPower = gl.getUniformLocation(prog, "uPower");
		gl.uniform3fv(gl.getUniformLocation(prog, "uFlareCol"), pal.flare);
		gl.uniform3fv(gl.getUniformLocation(prog, "uSmokeCol"), pal.smoke);
		gl.uniform3fv(gl.getUniformLocation(prog, "uSmokeDay"), pal.smokeDay);
		uLight = gl.getUniformLocation(prog, "uLight");
	} else {
		section.classList.add("hb-no-gl");
	}

	const sctx = sparksCv.getContext("2d")!;

	// ---------- Tamaños ----------
	let W = 0, H = 0, dpr = 1;
	const resize = () => {
		const r = smoke.getBoundingClientRect();
		W = r.width; H = r.height;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		// El humo es difuso: se renderiza a baja resolución y el navegador lo escala.
		const scale = W < 768 ? 0.35 : 0.5;
		smoke.width = Math.max(1, Math.round(W * scale));
		smoke.height = Math.max(1, Math.round(H * scale));
		sparksCv.width = Math.round(W * dpr);
		sparksCv.height = Math.round(H * dpr);
		if (gl) gl.viewport(0, 0, smoke.width, smoke.height);
		if (reduced) frame(performance.now());
	};

	// ---------- Posición de la bengala ----------
	// Coordenadas en px relativas al canvas, origen arriba-izquierda.
	let fx = 0, fy = 0, tx = 0, ty = 0, started = false;
	let pointerUntil = 0; // hasta cuándo manda el puntero
	const wander = (t: number) => {
		const s = t / 1000;
		return [
			W * (0.5 + (W < 768 ? 0.2 : 0.3) * Math.sin(s * 0.33) + 0.05 * Math.sin(s * 1.27)),
			H * (0.68 + 0.1 * Math.sin(s * 0.51) + 0.03 * Math.sin(s * 1.9)),
		];
	};
	const setFromEvent = (e: PointerEvent, hold: number) => {
		const r = smoke.getBoundingClientRect();
		const x = e.clientX - r.left, y = e.clientY - r.top;
		if (x < 0 || y < 0 || x > r.width || y > r.height) return;
		tx = x; ty = y; pointerUntil = performance.now() + hold;
	};
	window.addEventListener("pointermove", (e) => {
		if (e.pointerType === "mouse" || e.pointerType === "pen") setFromEvent(e, 2500);
	}, { passive: true });
	// En pantallas táctiles solo un toque corto mueve la bengala; arrastrar para scrollear no.
	let downX = 0, downY = 0, downT = 0;
	section.addEventListener("pointerdown", (e) => {
		downX = e.clientX; downY = e.clientY; downT = performance.now();
	}, { passive: true });
	section.addEventListener("pointerup", (e) => {
		if (e.pointerType === "mouse") return;
		const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
		if (moved < 10 && performance.now() - downT < 350) setFromEvent(e, 3500);
	}, { passive: true });

	// ---------- Chispas ----------
	const sparks: Spark[] = [];
	const [fr, fg, fb] = pal.flare.map((v) => Math.round(150 + v * 105));
	const [dr, dg, db] = pal.smoke.map((v) => Math.round(v * 200));

	// ---------- Loop ----------
	let raf = 0, last = performance.now(), visible = true, power = 0;
	const t0 = performance.now();

	function frame(now: number) {
		const dt = Math.min((now - last) / 1000, 0.05);
		last = now;
		const t = reduced ? 9000 : now - t0;

		if (!started) {
			const [wx] = wander(t);
			fx = wx; fy = H * 1.05; // entra desde abajo
			started = true;
		}
		if (reduced || now > pointerUntil) { [tx, ty] = wander(t); }
		const k = reduced ? 1 : 1 - Math.exp(-dt * 5);
		fx += (tx - fx) * k;
		fy += (ty - fy) * k;

		// Encendido + parpadeo irregular
		const ignite = reduced ? 1 : Math.min(1, (now - t0) / 1400);
		const s = t / 1000;
		const flicker = reduced ? 1 : 1 + 0.16 * Math.sin(s * 23.1) * Math.sin(s * 7.3) + 0.08 * Math.sin(s * 51.7);
		power = ignite * ignite * flicker;

		if (gl) {
			gl.uniform2f(uRes, smoke.width, smoke.height);
			gl.uniform1f(uTime, t / 1000);
			gl.uniform2f(uFlare, fx / W, 1 - fy / H);
			gl.uniform1f(uPower, power);
			gl.uniform1f(uLight, isLight ? 1 : 0);
			gl.drawArrays(gl.TRIANGLES, 0, 3);
		} else {
			section.style.setProperty("--fx", `${fx}px`);
			section.style.setProperty("--fy", `${fy}px`);
		}

		// Chispas
		sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		sctx.clearRect(0, 0, W, H);
		if (!reduced) {
			const n = Math.round(5 * ignite * (W < 768 ? 0.6 : 1));
			for (let i = 0; i < n; i++) {
				const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
				const v = 120 + Math.random() * 260;
				const max = 0.35 + Math.random() * 0.7;
				sparks.push({ x: fx, y: fy, vx: Math.cos(a) * v + (tx - fx) * 0.8, vy: Math.sin(a) * v, life: max, max });
			}
			sctx.globalCompositeOperation = isLight ? "source-over" : "lighter";
			sctx.lineCap = "round";
			for (let i = sparks.length - 1; i >= 0; i--) {
				const p = sparks[i];
				p.life -= dt;
				if (p.life <= 0) { sparks.splice(i, 1); continue; }
				p.vy += 420 * dt; // gravedad
				p.vx *= 0.985;
				const px = p.x, py = p.y;
				p.x += p.vx * dt; p.y += p.vy * dt;
				const life = p.life / p.max;
				sctx.strokeStyle = isLight
					? `rgba(${life > 0.6 ? "90,190,240" : `${dr},${dg},${db}`},${life * 0.9})`
					: `rgba(${life > 0.6 ? "255,255,240" : `${fr},${fg},${fb}`},${life})`;
				sctx.lineWidth = 0.6 + life * 1.4;
				sctx.beginPath();
				sctx.moveTo(px, py);
				sctx.lineTo(p.x, p.y);
				sctx.stroke();
			}
		}

		// Letras: brillo según distancia + sombra proyectada lejos de la bengala
		if (letters.length) {
			const cr = smoke.getBoundingClientRect();
			const R = Math.max(260, W * 0.28);
			for (const el of letters) {
				const r = el.getBoundingClientRect();
				const dx = r.left + r.width / 2 - cr.left - fx;
				const dy = r.top + r.height / 2 - cr.top - fy;
				const d = Math.hypot(dx, dy) || 1;
				const lit = Math.max(0, 1 - d / R);
				const kk = lit * lit * Math.min(power, 1.2);
				const len = 4 + 18 * kk;
				el.style.setProperty("--k", kk.toFixed(3));
				el.style.setProperty("--sx", `${((dx / d) * len).toFixed(1)}px`);
				el.style.setProperty("--sy", `${((dy / d) * len).toFixed(1)}px`);
			}
		}

		if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
		else raf = 0;
	}

	const start = () => {
		if (reduced || raf || !visible || document.hidden) return;
		last = performance.now();
		raf = requestAnimationFrame(frame);
	};

	new MutationObserver(() => {
		isLight = !document.documentElement.classList.contains("dark");
		if (reduced) frame(performance.now());
	}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

	new ResizeObserver(resize).observe(smoke);
	new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }).observe(section);
	document.addEventListener("visibilitychange", start);

	resize();
	if (reduced) frame(performance.now());
	else start();
}

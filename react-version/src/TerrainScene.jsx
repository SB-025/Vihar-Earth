import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// A sculpted landscape, drawn as translucent topographic survey lines.
const vertexShader = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uEnergy;
  varying vec3 vTerrain;
  varying float vGlow;
  void main() {
    vec3 p = position;
    float distanceToPointer = distance(p.xy, uPointer);
    float hill = sin(p.x * .55 + .6) * cos(p.y * .48) * .62;
    hill += sin(p.x * .95 - p.y * .32) * .18;
    hill += cos(p.y * .8 + p.x * .22) * .22;
    hill += sin(p.x * .35 + uTime * .18) * .08;
    float ripple = sin(distanceToPointer * 3.5 - uTime * 1.7)
      * exp(-distanceToPointer * .55) * .16 * uEnergy;
    p.z = hill + ripple;
    vTerrain = p;
    vGlow = exp(-distanceToPointer * .65) * uEnergy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const fragmentShader = `
  varying vec3 vTerrain;
  varying float vGlow;
  float line(float value) {
    float width = max(fwidth(value), .015);
    return 1.0 - smoothstep(.0, width * 1.3, abs(fract(value - .5) - .5));
  }
  void main() {
    float contour = line(vTerrain.z * 8.0);
    float grid = max(line(vTerrain.x * .65), line(vTerrain.y * .65)) * .22;
    float edge = 1.0 - smoothstep(.55, 1.0, max(abs(vTerrain.x) / 8.0, abs(vTerrain.y) / 5.0));
    vec3 bronze = mix(vec3(.56, .49, .32), vec3(.94, .82, .54), contour);
    bronze += vGlow * vec3(.18, .16, .09);
    float alpha = (.025 + contour * .53 + grid + vGlow * .08) * edge;
    gl_FragColor = vec4(bronze, alpha);
  }
`;

export default function TerrainScene({ paused }) {
  const host = useRef(null);
  const pausedRef = useRef(paused);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    const mount = host.current;
    const interaction = mount.closest(".hero") || mount;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
      });
    } catch {
      setUnavailable(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
    camera.position.set(0, 4.5, 7);
    camera.lookAt(0, 0, 0);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(2, 0) },
        uEnergy: { value: 0 },
      },
    });
    const geometry = new THREE.PlaneGeometry(16, 10, 180, 110);
    const terrain = new THREE.Mesh(geometry, material);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.set(2, -1, 0);
    scene.add(terrain);
    const target = new THREE.Vector2(2, 0);
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1);
    const hit = new THREE.Vector3();
    let active = false,
      visible = true,
      frame = 0,
      last = 0,
      elapsed = 0,
      drift = 0;
    const move = (event) => {
      if (pausedRef.current) return;
      const rect = mount.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(ground, hit))
        target.set(hit.x - 2, -hit.z);
      drift = pointer.x;
      active = true;
    };
    const leave = () => {
      active = false;
      drift = 0;
    };
    interaction.addEventListener("pointermove", move, { passive: true });
    interaction.addEventListener("pointerdown", move, { passive: true });
    interaction.addEventListener("pointerleave", leave);
    interaction.addEventListener("pointerup", eventUp);
    function eventUp(event) {
      if (event.pointerType === "touch") leave();
    }
    const resize = new ResizeObserver(() => {
      const width = mount.clientWidth,
        height = mount.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    });
    resize.observe(mount);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(mount);
    function animate(time) {
      frame = requestAnimationFrame(animate);
      if (!visible || document.hidden || time - last < 32) return;
      const delta = Math.min((time - last) / 1000, 0.05);
      last = time;
      if (!pausedRef.current) {
        elapsed += delta;
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uPointer.value.lerp(target, 0.07);
        material.uniforms.uEnergy.value +=
          ((active ? 1 : 0) - material.uniforms.uEnergy.value) * 0.045;
        camera.position.x += (drift * 0.35 - camera.position.x) * 0.035;
        camera.lookAt(0, 0, 0);
      }
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    const lost = (event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setUnavailable(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      interaction.removeEventListener("pointermove", move);
      interaction.removeEventListener("pointerdown", move);
      interaction.removeEventListener("pointerleave", leave);
      interaction.removeEventListener("pointerup", eventUp);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className={`terrain-stage${unavailable ? " terrain-unavailable" : ""}`}
      ref={host}
      aria-hidden="true"
    >
      {unavailable && <div className="terrain-fallback" />}
    </div>
  );
}

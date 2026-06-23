/**
 * R.A.G.E Order System — Interactive Effects
 * Premium Micro-interactions
 */

document.addEventListener("DOMContentLoaded", () => {
  initParticleBackground();
  initButtonRipples();
  initGlowBorders();
});

/* ==================================================
  2. Button Ripple Effect
================================================== */
function initButtonRipples() {
  const buttons = document.querySelectorAll(".btn-primary, .btn-secondary, .btn-success, .login-btn");
  
  buttons.forEach(btn => {
    btn.addEventListener("mousedown", function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const circle = document.createElement("span");
      circle.classList.add("ripple-effect");
      circle.style.left = `${x}px`;
      circle.style.top = `${y}px`;
      
      this.appendChild(circle);
      
      setTimeout(() => {
        circle.remove();
      }, 600);
    });
  });
}

/* ==================================================
  3. Glow Borders Tracking
================================================== */
function initGlowBorders() {
  const cards = document.querySelectorAll(".glass-card, .login-card");
  
  cards.forEach(card => {
    card.addEventListener("mousemove", e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });
}

/* ==================================================
  4. Particle Background
================================================== */
function initParticleBackground() {
  // Only add if not strictly in a specific page where we don't want it, though mostly we want it everywhere
  const canvas = document.createElement("canvas");
  canvas.id = "particle-canvas";
  // Apply z-index strictly below all content
  Object.assign(canvas.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "-1",
    opacity: "0.6" // Subtle opacity
  });
  
  // Insert exactly at the start of body so it sits below everything but is visible
  document.body.insertBefore(canvas, document.body.firstChild);
  
  const ctx = canvas.getContext("2d");
  let particlesArray = [];
  
  function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener('resize', setCanvasSize);
  setCanvasSize();

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5; // very small particles
      this.speedX = Math.random() * 0.5 - 0.25; // drift slowly
      this.speedY = Math.random() * 0.5 - 0.25; 
      // gold-ish colors
      const r = Math.floor(Math.random() * 50 + 205); // 205-255
      const g = Math.floor(Math.random() * 50 + 140); // 140-190
      const b = Math.floor(Math.random() * 20 + 20);  // 20-40
      const a = Math.random() * 0.5 + 0.1;
      this.color = `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      // wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function init() {
    particlesArray = [];
    const numberOfParticles = Math.min((canvas.width * canvas.height) / 10000, 100); // density
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArray.push(new Particle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    requestAnimationFrame(animate);
  }

  init();
  animate();
}

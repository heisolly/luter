import React, { useRef, useState, useEffect } from 'react';
import Matter from 'matter-js';

const defaultElements = [
  { text: "❓ Quiz", color: "#EC4899", bgColor: "#FDF2F8", borderColor: "#FBCFE8" },
  { text: "🗂️ Flashcards", color: "#6366F1", bgColor: "#EEF2FF", borderColor: "#C7D2FE" },
  { text: "📝 Summary", color: "#8B5CF6", bgColor: "#F5F3FF", borderColor: "#DDD6FE" },
  { text: "🎓 Board", color: "#A855F7", bgColor: "#FAF5FF", borderColor: "#E9D5FF" },
  { text: "🎮 Games", color: "#E11D48", bgColor: "#FFF1F2", borderColor: "#FFE4E6" },
  { text: "⚡ Luter", color: "#7C3AED", bgColor: "#F5F3FF", borderColor: "#DDD6FE" },
  { text: "❤️ Love", color: "#EF4444", bgColor: "#FEF2F2", borderColor: "#FEE2E2" },
  { text: "🧠 Brain", color: "#4F46E5", bgColor: "#EEF2FF", borderColor: "#C7D2FE" },
  { text: "✨ Magic", color: "#D97706", bgColor: "#FFFBEB", borderColor: "#FEF3C7" },
];

export default function FallingElements({
  className = '',
  elements = defaultElements,
  gravity = 0.8,
  restitution = 0.7,
  mouseConstraintStiffness = 0.2,
  loop = false
}) {
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const elementsContainerRef = useRef(null);
  const [effectStarted, setEffectStarted] = useState(false);

  // Trigger effect automatically on scroll or click
  useEffect(() => {
    if (containerRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEffectStarted(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!effectStarted || !containerRef.current) return;

    const { Engine, Render, World, Bodies, Runner, Mouse, MouseConstraint } = Matter;

    const containerRect = containerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    if (width <= 0 || height <= 0) return;

    // Create Matter engine
    const engine = Engine.create();
    engine.world.gravity.y = gravity;

    // Create transparent renderer
    const render = Render.create({
      element: canvasContainerRef.current,
      engine,
      options: {
        width,
        height,
        background: 'transparent',
        wireframes: false
      }
    });

    // Boundaries
    const boundaryOptions = {
      isStatic: true,
      render: { fillStyle: 'transparent' }
    };
    const floor = Bodies.rectangle(width / 2, height + 25, width, 50, boundaryOptions);
    const leftWall = Bodies.rectangle(-25, height / 2, 50, height, boundaryOptions);
    const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, boundaryOptions);
    const ceiling = Bodies.rectangle(width / 2, -200, width, 50, boundaryOptions); // high ceiling so they fall from top

    // Map DOM elements to physics bodies
    const badges = elementsContainerRef.current.querySelectorAll('.falling-badge');
    const badgeBodies = [...badges].map((elem, index) => {
      const rect = elem.getBoundingClientRect();

      // Distribute starting positions nicely at the top
      const x = (width / (badges.length + 1)) * (index + 1) + (Math.random() - 0.5) * 20;
      const y = -50 - (index * 40); // Stagger fall

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: restitution,
        frictionAir: 0.02,
        friction: 0.1,
        render: { fillStyle: 'transparent' }
      });

      // Apply initial velocity & spin
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 4,
        y: Math.random() * 2
      });
      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);

      return { elem, body };
    });

    // Mouse control
    const mouse = Mouse.create(containerRef.current);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: mouseConstraintStiffness,
        render: { visible: false }
      }
    });
    render.mouse = mouse;

    const worldBodies = loop 
      ? [leftWall, rightWall, ceiling, mouseConstraint, ...badgeBodies.map(bb => bb.body)]
      : [floor, leftWall, rightWall, ceiling, mouseConstraint, ...badgeBodies.map(bb => bb.body)];

    World.add(engine.world, worldBodies);

    const runner = Runner.create();
    Runner.run(runner, engine);
    Render.run(render);

    // Sync loop
    let animId;
    const updateLoop = () => {
      badgeBodies.forEach(({ body, elem }) => {
        let { x, y } = body.position;
        
        if (loop && y > height + 100) {
          Matter.Body.setPosition(body, {
            x: Math.random() * width,
            y: -100 - Math.random() * 50
          });
          Matter.Body.setVelocity(body, { x: 0, y: 0 });
          Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.1);
          x = body.position.x;
          y = body.position.y;
        }

        elem.style.left = `${x}px`;
        elem.style.top = `${y}px`;
        elem.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
      });
      Matter.Engine.update(engine);
      animId = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    // Resize listener
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      Matter.Body.setPosition(floor, { x: rect.width / 2, y: rect.height + 25 });
      Matter.Body.setPosition(rightWall, { x: rect.width + 25, y: rect.height / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      Render.stop(render);
      Runner.stop(runner);
      window.removeEventListener('resize', handleResize);
      if (render.canvas && canvasContainerRef.current) {
        canvasContainerRef.current.removeChild(render.canvas);
      }
      World.clear(engine.world);
      Engine.clear(engine);
    };
  }, [effectStarted, elements, gravity, restitution, mouseConstraintStiffness]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
    >
      {/* Physics Canvas Area */}
      <div ref={canvasContainerRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Floating HTML elements mapped to bodies */}
      <div ref={elementsContainerRef} className="absolute inset-0 z-10 pointer-events-none">
        {elements.map((el, i) => (
          <div
            key={i}
            className="falling-badge absolute pointer-events-auto px-4 py-2 rounded-full font-bold text-sm border shadow-sm transition-shadow hover:shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            style={{
              color: el.color,
              backgroundColor: el.bgColor,
              borderColor: el.borderColor,
              fontSize: el.fontSize || undefined,
              left: '-9999px', // Initial hide before Matter calculates position
              top: '-9999px',
            }}
          >
            {el.text}
          </div>
        ))}
      </div>
    </div>
  );
}

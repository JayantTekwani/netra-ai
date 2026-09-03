import sys

file_path = 'netra-ai/frontend/src/components/graph/HolographicGraph.tsx'
with open(file_path, 'r') as f:
    content = f.read()

rep1_old = '''  const [activeFilter, setActiveFilter] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);'''
rep1_new = '''  const [activeFilter, setActiveFilter] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);
  const [is2D, setIs2D] = useState(false);
  const is2DRef = useRef(false);'''

rep2_old = '''    let rotX = -0.2, rotY = 0.42, zoom = 1;
    let velX = 0, velY = 0;
    const FOCAL = 520;
    let focusTarget: { rotY: number, rotX: number } | null = null;
    let focusZoom: number | null = null;
    let lastProjected: Record<string, any> = {};

    function project(n: any, w: number, h: number) {
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x = n.x * cosY - n.z * sinY;
      let z = n.x * sinY + n.z * cosY;'''
rep2_new = '''    let rotX = -0.2, rotY = 0.42, zoom = 1;
    let velX = 0, velY = 0;
    let zMult = 1;
    const FOCAL = 520;
    let focusTarget: { rotY: number, rotX: number } | null = null;
    let focusZoom: number | null = null;
    let lastProjected: Record<string, any> = {};

    function project(n: any, w: number, h: number) {
      const ez = n.z * zMult;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      let x = n.x * cosY - ez * sinY;
      let z = n.x * sinY + ez * cosY;'''

rep3_alt_old = '''    function loop() {
      if (isDragging) {'''
rep3_alt_new = '''    function loop() {
      const targetZMult = is2DRef.current ? 0.001 : 1.0;
      zMult += (targetZMult - zMult) * 0.08;

      if (isDragging) {'''

rep4_old = '''    (window as any).__holoReset = () => {
      focusTarget = null; focusZoom = null;
      rotX = -0.2; rotY = 0.42; zoom = 1; velX = 0; velY = 0;
    };
    
    (window as any).__holoToggleAuto = () => {
      currentAutoRotate = !currentAutoRotate;
      setAutoRotate(currentAutoRotate);
    };'''
rep4_new = '''    (window as any).__holoReset = () => {
      focusTarget = null; focusZoom = null;
      rotX = is2DRef.current ? 0 : -0.2; 
      rotY = is2DRef.current ? 0 : 0.42; 
      zoom = 1; velX = 0; velY = 0;
    };
    
    (window as any).__holoToggleAuto = () => {
      currentAutoRotate = !currentAutoRotate;
      setAutoRotate(currentAutoRotate);
    };

    (window as any).__holoTo2D = () => {
      focusTarget = { rotY: 0, rotX: 0 };
      currentAutoRotate = false;
      setAutoRotate(false);
    };'''

rep5_old = '''      scene.removeEventListener('dblclick', onSceneDblClick);
      delete (window as any).__holoReset;
      delete (window as any).__holoToggleAuto;
    };'''
rep5_new = '''      scene.removeEventListener('dblclick', onSceneDblClick);
      delete (window as any).__holoReset;
      delete (window as any).__holoToggleAuto;
      delete (window as any).__holoTo2D;
    };'''

rep6_old = '''        <div className="holo-controls">
          <div 
            className={`holo-btn ${autoRotate ? 'active' : ''}`} 
            onClick={() => (window as any).__holoToggleAuto?.()} 
            title="Toggle auto-rotate"
          >⟳</div>
          <div 
            className="holo-btn" 
            onClick={() => (window as any).__holoReset?.()} 
            title="Reset view"
          >⤾</div>
        </div>'''
rep6_new = '''        <div className="holo-controls">
          <div 
            className={`holo-btn ${is2D ? 'active' : ''}`} 
            onClick={() => {
              const next = !is2D;
              setIs2D(next);
              is2DRef.current = next;
              if (next && (window as any).__holoTo2D) {
                 (window as any).__holoTo2D();
              }
            }} 
            title="Toggle 2D/3D"
          >2D</div>
          <div 
            className={`holo-btn ${autoRotate ? 'active' : ''}`} 
            onClick={() => (window as any).__holoToggleAuto?.()} 
            title="Toggle auto-rotate"
          >⟳</div>
          <div 
            className="holo-btn" 
            onClick={() => (window as any).__holoReset?.()} 
            title="Reset view"
          >⤾</div>
        </div>'''

for rold, rnew in [(rep1_old, rep1_new), (rep2_old, rep2_new), (rep3_alt_old, rep3_alt_new), (rep4_old, rep4_new), (rep5_old, rep5_new), (rep6_old, rep6_new)]:
    if rold not in content:
        print(f'Failed to find:\\n{rold}')
        sys.exit(1)
    content = content.replace(rold, rnew)

with open(file_path, 'w') as f:
    f.write(content)

print('Success!')

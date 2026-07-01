const fs = require('fs');
let code = fs.readFileSync('src/components/dashboard/DashboardHome.jsx', 'utf8');

// 1. Add useRef to imports if not there
if (!code.includes('useRef')) {
  code = code.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useRef }");
  code = code.replace("import { useState, useEffect }", "import { useState, useEffect, useRef }");
}

// 2. Add refs to DashboardHome component
if (!code.includes('const keysDropdownRef')) {
  const stateInjectionStr = '  const [isXpOpen, setIsXpOpen] = useState(false);';
  const refsStr = `
  const keysDropdownRef = useRef(null);
  const xpDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (keysDropdownRef.current && !keysDropdownRef.current.contains(event.target)) {
        setIsKeysOpen(false);
      }
      if (xpDropdownRef.current && !xpDropdownRef.current.contains(event.target)) {
        setIsXpOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
`;
  code = code.replace(stateInjectionStr, stateInjectionStr + '\n' + refsStr);
}

// 3. Add ref to keys wrapper
const keysWrapperMatch = '{/* Keys Button Wrapper */}\n        <div style={{ position: \'relative\' }}>';
if (code.includes(keysWrapperMatch)) {
  code = code.replace(keysWrapperMatch, '{/* Keys Button Wrapper */}\n        <div style={{ position: \'relative\' }} ref={keysDropdownRef}>');
}

// 4. Add ref to xp wrapper
const xpWrapperMatch = '{/* Lightning Button Wrapper */}\n        <div style={{ position: \'relative\' }}>';
if (code.includes(xpWrapperMatch)) {
  code = code.replace(xpWrapperMatch, '{/* Lightning Button Wrapper */}\n        <div style={{ position: \'relative\' }} ref={xpDropdownRef}>');
}

fs.writeFileSync('src/components/dashboard/DashboardHome.jsx', code);
console.log('Refs and useEffect injected');
